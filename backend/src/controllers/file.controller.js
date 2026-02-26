// ============================================
// FILE CONTROLLER
// Handles file upload, download, and management
// ============================================

const { validationResult } = require('express-validator');
const storageService = require('../services/storage.service');
const { generateFileName } = require('../middleware/upload.middleware');
const { supabase } = require('../config/supabase');

/**
 * Upload file to case
 * POST /api/files/upload
 */
exports.uploadFile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        errors: errors.array()
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: 'No File',
        message: 'No file uploaded'
      });
    }

    const { case_id, description } = req.body;
    const userId = req.user.id;

    // Verify case exists and user has access
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('id, driver_id, assigned_operator_id, assigned_attorney_id')
      .eq('id', case_id)
      .single();

    if (caseError || !caseData) {
      return res.status(404).json({
        error: 'Case Not Found',
        message: 'Case does not exist'
      });
    }

    // Check if user has access to this case
    const hasAccess = 
      req.user.role === 'admin' ||
      caseData.driver_id === userId ||
      caseData.assigned_operator_id === userId ||
      caseData.assigned_attorney_id === userId;

    if (!hasAccess) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this case'
      });
    }

    // Scan file for viruses
    const scanResult = await storageService.scanForVirus(req.file.buffer);
    if (!scanResult.isClean) {
      return res.status(400).json({
        error: 'Virus Detected',
        message: 'File contains malicious content and cannot be uploaded',
        threats: scanResult.threats
      });
    }

    // Calculate file hash
    const fileHash = storageService.calculateFileHash(req.file.buffer);

    // Generate unique filename
    const fileName = generateFileName(req.file.originalname, userId);
    const folder = `cases/${case_id}`;

    // Upload to Supabase Storage
    const uploadResult = await storageService.uploadToSupabase(
      req.file.buffer,
      fileName,
      req.file.mimetype,
      folder
    );

    // Store file metadata in database
    const fileMetadata = await storageService.storeFileMetadata({
      caseId: case_id,
      uploadedBy: userId,
      fileName: req.file.originalname,
      filePath: uploadResult.fullPath,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      fileHash: fileHash,
      isVirusScanned: true,
      virusScanResult: scanResult,
      description: description || null
    });

    res.status(201).json({
      message: 'File uploaded successfully',
      file: {
        id: fileMetadata.id,
        file_name: fileMetadata.file_name,
        file_size: fileMetadata.file_size,
        mime_type: fileMetadata.mime_type,
        uploaded_at: fileMetadata.created_at
      }
    });

  } catch (error) {
    console.error('Upload file error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'File upload failed'
    });
  }
};

/**
 * Upload multiple files
 * POST /api/files/upload-multiple
 */
exports.uploadMultipleFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No Files',
        message: 'No files uploaded'
      });
    }

    const { case_id } = req.body;
    const userId = req.user.id;

    // Verify case exists and user has access
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('id, driver_id, assigned_operator_id, assigned_attorney_id')
      .eq('id', case_id)
      .single();

    if (caseError || !caseData) {
      return res.status(404).json({
        error: 'Case Not Found',
        message: 'Case does not exist'
      });
    }

    const hasAccess = 
      req.user.role === 'admin' ||
      caseData.driver_id === userId ||
      caseData.assigned_operator_id === userId ||
      caseData.assigned_attorney_id === userId;

    if (!hasAccess) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this case'
      });
    }

    const uploadedFiles = [];
    const errors = [];

    // Process each file
    for (const file of req.files) {
      try {
        // Scan for viruses
        const scanResult = await storageService.scanForVirus(file.buffer);
        if (!scanResult.isClean) {
          errors.push({
            fileName: file.originalname,
            error: 'Virus detected'
          });
          continue;
        }

        // Calculate file hash
        const fileHash = storageService.calculateFileHash(file.buffer);

        // Generate unique filename
        const fileName = generateFileName(file.originalname, userId);
        const folder = `cases/${case_id}`;

        // Upload to Supabase Storage
        const uploadResult = await storageService.uploadToSupabase(
          file.buffer,
          fileName,
          file.mimetype,
          folder
        );

        // Store metadata
        const fileMetadata = await storageService.storeFileMetadata({
          caseId: case_id,
          uploadedBy: userId,
          fileName: file.originalname,
          filePath: uploadResult.fullPath,
          fileSize: file.size,
          mimeType: file.mimetype,
          fileHash: fileHash,
          isVirusScanned: true,
          virusScanResult: scanResult
        });

        uploadedFiles.push({
          id: fileMetadata.id,
          file_name: fileMetadata.file_name,
          file_size: fileMetadata.file_size,
          mime_type: fileMetadata.mime_type
        });

      } catch (error) {
        console.error(`Error uploading file ${file.originalname}:`, error);
        errors.push({
          fileName: file.originalname,
          error: error.message
        });
      }
    }

    res.status(201).json({
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
      files: uploadedFiles,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Upload multiple files error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Multiple file upload failed'
    });
  }
};

/**
 * Download file
 * GET /api/files/:id/download
 */
exports.downloadFile = async (req, res) => {
  try {
    const fileId = req.params.id;
    const userId = req.user.id;

    // Get file metadata from database
    const fileMetadata = await storageService.getFileMetadataFromDb(fileId);

    // Verify user has access to the case
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('driver_id, assigned_operator_id, assigned_attorney_id')
      .eq('id', fileMetadata.case_id)
      .single();

    if (caseError || !caseData) {
      return res.status(404).json({
        error: 'Case Not Found',
        message: 'Associated case not found'
      });
    }

    const hasAccess = 
      req.user.role === 'admin' ||
      caseData.driver_id === userId ||
      caseData.assigned_operator_id === userId ||
      caseData.assigned_attorney_id === userId;

    if (!hasAccess) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this file'
      });
    }

    // Generate signed URL (valid for 1 hour)
    const signedUrl = await storageService.generateSignedUrl(fileMetadata.file_path, 3600);

    res.json({
      download_url: signedUrl,
      file_name: fileMetadata.file_name,
      expires_in: 3600
    });

  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'File download failed'
    });
  }
};

/**
 * Get file details
 * GET /api/files/:id
 */
exports.getFileDetails = async (req, res) => {
  try {
    const fileId = req.params.id;
    const userId = req.user.id;

    // Get file metadata
    const fileMetadata = await storageService.getFileMetadataFromDb(fileId);

    // Verify access
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('driver_id, assigned_operator_id, assigned_attorney_id')
      .eq('id', fileMetadata.case_id)
      .single();

    if (caseError || !caseData) {
      return res.status(404).json({
        error: 'Case Not Found',
        message: 'Associated case not found'
      });
    }

    const hasAccess = 
      req.user.role === 'admin' ||
      caseData.driver_id === userId ||
      caseData.assigned_operator_id === userId ||
      caseData.assigned_attorney_id === userId;

    if (!hasAccess) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this file'
      });
    }

    res.json({
      file: fileMetadata
    });

  } catch (error) {
    console.error('Get file details error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get file details'
    });
  }
};

/**
 * Get all files for a case
 * GET /api/files/case/:caseId
 */
exports.getCaseFiles = async (req, res) => {
  try {
    const caseId = req.params.caseId;
    const userId = req.user.id;

    // Verify case exists and user has access
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('driver_id, assigned_operator_id, assigned_attorney_id')
      .eq('id', caseId)
      .single();

    if (caseError || !caseData) {
      return res.status(404).json({
        error: 'Case Not Found',
        message: 'Case does not exist'
      });
    }

    const hasAccess = 
      req.user.role === 'admin' ||
      caseData.driver_id === userId ||
      caseData.assigned_operator_id === userId ||
      caseData.assigned_attorney_id === userId;

    if (!hasAccess) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this case'
      });
    }

    // Get all files for the case
    const { data: files, error: filesError } = await supabase
      .from('case_documents')
      .select(`
        *,
        uploader:uploaded_by(full_name, email)
      `)
      .eq('case_id', caseId)
      .order('created_at', { ascending: false });

    if (filesError) {
      console.error('Get case files error:', filesError);
      return res.status(500).json({
        error: 'Query Failed',
        message: 'Failed to retrieve files'
      });
    }

    res.json({
      files: files || []
    });

  } catch (error) {
    console.error('Get case files error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get case files'
    });
  }
};

/**
 * Delete file
 * DELETE /api/files/:id
 */
exports.deleteFile = async (req, res) => {
  try {
    const fileId = req.params.id;
    const userId = req.user.id;

    // Get file metadata
    const fileMetadata = await storageService.getFileMetadataFromDb(fileId);

    // Only uploader, admin, or case owner can delete
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('driver_id')
      .eq('id', fileMetadata.case_id)
      .single();

    if (caseError || !caseData) {
      return res.status(404).json({
        error: 'Case Not Found',
        message: 'Associated case not found'
      });
    }

    const canDelete = 
      req.user.role === 'admin' ||
      fileMetadata.uploaded_by === userId ||
      caseData.driver_id === userId;

    if (!canDelete) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to delete this file'
      });
    }

    // Delete from storage
    await storageService.deleteFromSupabase(fileMetadata.file_path);

    // Delete metadata from database
    await storageService.deleteFileMetadata(fileId);

    res.json({
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'File deletion failed'
    });
  }
};

module.exports = exports;
