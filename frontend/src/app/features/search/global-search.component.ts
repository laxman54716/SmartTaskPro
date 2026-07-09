import { Component, OnInit, OnDestroy, inject, Input, Output, EventEmitter, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskResponse, TaskStatus, TaskPriority } from '../../core/models/task.models';

@Component({
  selector: 'app-global-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './global-search.component.html',
  styleUrls: ['./global-search.component.css']
})
export class GlobalSearchComponent implements OnInit, OnDestroy {
  @Input() tasks: TaskResponse[] = [];
  @Output() selectTask = new EventEmitter<TaskResponse>();
  @Output() close = new EventEmitter<void>();

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  searchQuery = '';
  filteredResults: TaskResponse[] = [];
  selectedIndex = -1;

  ngOnInit(): void {
    this.filterTasks();
    // Auto focus search input on creation
    setTimeout(() => {
      if (this.searchInput) {
        this.searchInput.nativeElement.focus();
      }
    }, 50);
  }

  ngOnDestroy(): void {}

  filterTasks(): void {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) {
      // Show all tasks up to 5 by default
      this.filteredResults = this.tasks.slice(0, 5);
    } else {
      this.filteredResults = this.tasks.filter(t => 
        t.title.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.category?.toLowerCase().includes(query) ||
        t.tags?.toLowerCase().includes(query) ||
        (t.labels && t.labels.some(l => l.toLowerCase().includes(query)))
      );
    }
    this.selectedIndex = this.filteredResults.length > 0 ? 0 : -1;
  }

  getPriorityLabel(priority: TaskPriority): string {
    return priority.toString();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close.emit();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (this.filteredResults.length > 0) {
        this.selectedIndex = (this.selectedIndex + 1) % this.filteredResults.length;
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (this.filteredResults.length > 0) {
        this.selectedIndex = (this.selectedIndex - 1 + this.filteredResults.length) % this.filteredResults.length;
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (this.selectedIndex >= 0 && this.selectedIndex < this.filteredResults.length) {
        this.onSelect(this.filteredResults[this.selectedIndex]);
      }
    }
  }

  onSelect(task: TaskResponse): void {
    this.selectTask.emit(task);
  }

  onOverlayClick(): void {
    this.close.emit();
  }
}
