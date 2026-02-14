import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'hyphenToSpace',
})
export class HyphenToSpacePipe implements PipeTransform {
  transform(value: string | null | undefined): string | null | undefined {
    if (!value) return value;

    return value.replace(/-/g, ' ');
  }
}
