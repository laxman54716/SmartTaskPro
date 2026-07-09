import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skeleton.component.html',
  styleUrls: ['./skeleton.component.css']
})
export class SkeletonComponent {
  @Input() count = 3;
  @Input() type: 'card' | 'row' | 'board' = 'card';

  get items(): number[] {
    return Array(this.count).fill(0);
  }
}
