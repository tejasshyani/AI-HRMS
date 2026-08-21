import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../../../services/employee.service';
import { ToastService } from '../../../services/toast.service';
import { User } from '../../../models';

@Component({
  selector: 'app-employee-directory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 pb-12 space-y-6 max-w-7xl mx-auto">
      
      <!-- Top Header & Actions -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-xl font-extrabold text-slate-900 tracking-tight">FinGoal Employee Directory</h1>
          <p class="text-xs text-slate-500 mt-0.5">Manage staff profiles, active status, reset passwords, and configure Base Monthly Salaries</p>
        </div>
        <button (click)="openAddModal()" class="btn btn-primary btn-sm flex items-center gap-2">
          <i class="fa-solid fa-user-plus"></i>
          <span>Add Employee</span>
        </button>
      </div>

      <!-- Search & Filters Toolbar (Compact 1-Line Header Bar) -->
      <div class="card p-3 px-4 border border-slate-200 flex flex-row items-center justify-between gap-3 overflow-x-auto">
        <div class="flex items-center gap-2.5 flex-1 min-w-[520px]">
          
          <!-- Search input (Clean, no overlapping icon) -->
          <div class="w-64">
            <input 
              type="text" 
              [(ngModel)]="searchQuery" 
              (input)="filterEmployees()" 
              placeholder="Search by name, email, username..." 
              class="form-control text-xs !py-1.5 !px-3 font-medium">
          </div>

          <!-- Department Filter -->
          <div class="w-48">
            <select [(ngModel)]="selectedDept" (change)="filterEmployees()" class="form-select text-xs !py-1.5 !px-3 font-medium">
              <option value="All">All Departments</option>
              <option value="Executive Management">Executive Management</option>
              <option value="UI/UX & Product Design">UI/UX & Product Design</option>
              <option value="Software Engineering">Software Engineering</option>
              <option value="Finance & Accounts">Finance & Accounts</option>
              <option value="Risk & Compliance">Risk & Compliance</option>
              <option value="Wealth Management">Wealth Management</option>
              <option value="Operations">Operations</option>
            </select>
          </div>

          <!-- Role Filter -->
          <div class="w-36">
            <select [(ngModel)]="selectedRole" (change)="filterEmployees()" class="form-select text-xs !py-1.5 !px-3 font-medium">
              <option value="All">All Roles</option>
              <option value="employee">Employees</option>
              <option value="admin">Admins</option>
            </select>
          </div>

        </div>

        <div class="text-xs text-slate-400 font-semibold whitespace-nowrap pl-3 border-l border-slate-100">
          Showing <span class="text-slate-800 font-bold">{{ filteredEmployees.length }}</span> Staff Members
        </div>
      </div>

      <!-- Employees Directory Table -->
      <div class="card p-6 border border-slate-200">
        <div class="overflow-x-auto">
          <table class="w-full text-xs">
            <thead>
              <tr class="border-b border-slate-100 text-slate-400 text-left font-semibold">
                <th class="py-3">Employee</th>
                <th class="py-3">Role & Dept</th>
                <th class="py-3">Contact</th>
                <th class="py-3">Base Monthly Salary (₹)</th>
                <th class="py-3 text-center">Status</th>
                <th class="py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium">
              <tr *ngFor="let emp of filteredEmployees" class="hover:bg-slate-50/70 transition-colors">
                
                <!-- Employee info -->
                <td class="py-3.5 flex items-center gap-3">
                  <div class="relative">
                    <img [src]="emp.avatar" class="w-9 h-9 rounded-xl bg-slate-100 border object-cover" alt="">
                    <span *ngIf="emp.role === 'admin'" class="absolute -top-1.5 -right-1.5 w-4 h-4 bg-purple-600 text-white rounded-full flex items-center justify-center text-[8px] shadow-xs" title="Administrator">
                      <i class="fa-solid fa-crown"></i>
                    </span>
                  </div>
                  <div>
                    <div class="flex items-center gap-1.5">
                      <span class="font-bold text-slate-900 text-sm">{{ emp.fullName }}</span>
                      <span *ngIf="emp.employeeId" class="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-[10px] font-bold border border-blue-200">
                        #{{ emp.employeeId }}
                      </span>
                      <span *ngIf="emp.role === 'admin'" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-extrabold text-[10px]">
                        <i class="fa-solid fa-user-shield text-purple-600"></i> Admin
                      </span>
                    </div>
                    <div class="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                      <span>ID: <strong class="text-slate-600">#{{ emp.employeeId || '—' }}</strong></span>
                    </div>
                  </div>
                </td>

                <!-- Role & Dept -->
                <td class="py-3.5">
                  <div class="font-semibold text-slate-800">{{ emp.designation || (emp.role === 'admin' ? 'Administrator' : 'Staff') }}</div>
                  <div class="text-[10px] text-slate-400">{{ emp.department || 'General' }}</div>
                </td>

                <!-- Contact -->
                <td class="py-3.5 text-slate-600">
                  <div>{{ emp.email }}</div>
                  <div class="text-[10px] text-slate-400 font-mono">{{ emp.phone || '—' }}</div>
                </td>

                <!-- Base Salary Rate config input (Employees only) -->
                <td class="py-3.5">
                  <div *ngIf="emp.role === 'employee'" class="flex items-center gap-1.5">
                    <span class="text-slate-500 font-bold text-xs">₹</span>
                    <input 
                      type="number" 
                      [(ngModel)]="emp.baseSalary" 
                      (change)="onSalaryChanged(emp)" 
                      class="!w-24 form-control !py-1 !px-2 text-xs font-mono font-bold text-slate-800 text-right">
                    <span class="text-[10px] text-slate-400">/mo</span>
                  </div>

                  <div *ngIf="emp.role === 'admin'" class="flex items-center gap-1.5">
                    <span class="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-semibold">
                      Non-Salaried (Admin)
                    </span>
                  </div>
                </td>

                <!-- Active Status Toggle -->
                <td class="py-3.5 text-center">
                  <button 
                    (click)="toggleStatus(emp)" 
                    class="badge text-[10px] cursor-pointer hover:opacity-80 transition-opacity"
                    [ngClass]="emp.isActive ? 'badge-present' : 'badge-absent'">
                    {{ emp.isActive ? 'Active' : 'Deactivated' }}
                  </button>
                </td>

                <!-- Actions -->
                <td class="py-3.5 text-right">
                  <button 
                    (click)="openEditModal(emp)" 
                    class="text-blue-600 hover:text-blue-800 p-1.5 rounded-lg hover:bg-blue-50 text-xs transition-colors">
                    <i class="fa-solid fa-user-pen"></i> Edit
                  </button>
                </td>

              </tr>

              <tr *ngIf="filteredEmployees.length === 0">
                <td colspan="6" class="py-12 text-center text-slate-400">
                  <i class="fa-solid fa-users-slash text-3xl mb-2 text-slate-300"></i>
                  <p>No employees found matching the filters.</p>
                </td>
              </tr>

            </tbody>
          </table>
        </div>
      </div>

      <!-- Add/Edit Employee Modal -->
      <div *ngIf="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
          
          <div class="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
            <h3 class="font-bold text-base text-slate-900">{{ isEditing ? 'Edit Employee Details' : 'Add New FinGoal Staff' }}</h3>
            <button (click)="showModal = false" class="text-slate-400 hover:text-slate-600">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <form (ngSubmit)="saveModalData()" class="space-y-3.5">
            
            <div class="grid grid-cols-2 gap-3">
              <div class="form-group mb-0">
                <label class="form-label">Full Name <span class="text-rose-500">*</span></label>
                <input type="text" [(ngModel)]="modalData.fullName" name="mFullName" placeholder="e.g. Maulik Rupareliya" required class="form-control text-xs">
              </div>
              <div class="form-group mb-0">
                <label class="form-label">Employee ID (4-digit) <span class="text-rose-500">*</span></label>
                <input type="text" [(ngModel)]="modalData.employeeId" name="mEmployeeId" placeholder="e.g. 1002" required maxlength="4" class="form-control text-xs font-mono font-bold">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="form-group mb-0">
                <label class="form-label">Email Address <span class="text-rose-500">*</span></label>
                <input type="email" [(ngModel)]="modalData.email" name="mEmail" required placeholder="e.g. maulik@gmail.com" class="form-control text-xs">
              </div>
              <div class="form-group mb-0">
                <label class="form-label">Phone Number</label>
                <input type="text" [(ngModel)]="modalData.phone" name="mPhone" placeholder="e.g. +91 98765 43210" class="form-control text-xs">
              </div>
            </div>

            <!-- Password Field: Required for new, optional reset for edit -->
            <div class="form-group mb-0" *ngIf="isEditing">
              <label class="form-label flex justify-between items-center">
                <span>Reset / Change Password</span>
                <span class="text-[10px] text-slate-400 font-normal">Leave blank to keep unchanged</span>
              </label>
              <div class="relative">
                <input 
                  [type]="showModalPassword ? 'text' : 'password'" 
                  [(ngModel)]="modalData.password" 
                  name="mPasswordEdit" 
                  placeholder="Enter new password to reset" 
                  class="form-control text-xs pr-8">
                <button 
                  type="button" 
                  (click)="showModalPassword = !showModalPassword" 
                  class="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 text-xs">
                  <i class="fa-solid" [ngClass]="showModalPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
                </button>
              </div>
            </div>

            <div class="form-group mb-0" *ngIf="!isEditing">
              <label class="form-label">Initial Password</label>
              <input type="password" [(ngModel)]="modalData.password" name="mPassword" placeholder="Default: FinGoal@123" class="form-control text-xs">
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="form-group mb-0">
                <label class="form-label">Department</label>
                <select [(ngModel)]="modalData.department" name="mDept" class="form-select text-xs">
                  <option value="UI/UX & Product Design">UI/UX & Product Design</option>
                  <option value="Software Engineering">Software Engineering</option>
                  <option value="Finance & Accounts">Finance & Accounts</option>
                  <option value="Risk & Compliance">Risk & Compliance</option>
                  <option value="Wealth Management">Wealth Management</option>
                  <option value="Executive Management">Executive Management</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>

              <div class="form-group mb-0">
                <label class="form-label">Designation</label>
                <input type="text" [(ngModel)]="modalData.designation" name="mDesig" class="form-control text-xs">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="form-group mb-0">
                <label class="form-label">Base Monthly Salary (₹) <span class="text-rose-500">*</span></label>
                <input type="number" [(ngModel)]="modalData.baseSalary" name="mSalary" required class="form-control text-xs font-mono">
              </div>

              <div class="form-group mb-0">
                <label class="form-label">Role</label>
                <select [(ngModel)]="modalData.role" name="mRole" class="form-select text-xs font-semibold">
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <!-- Modal Footer: Delete Button on Left + Actions on Right -->
            <div class="flex justify-between items-center pt-4 border-t border-slate-100">
              <div>
                <button 
                  type="button" 
                  *ngIf="isEditing" 
                  (click)="deleteEmployee(modalData)" 
                  class="btn btn-sm bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 flex items-center gap-1.5">
                  <i class="fa-solid fa-trash-can text-rose-600"></i>
                  <span>Delete Employee</span>
                </button>
              </div>

              <div class="flex gap-2">
                <button type="button" (click)="showModal = false" class="btn btn-secondary btn-sm">Cancel</button>
                <button type="submit" class="btn btn-primary btn-sm font-bold">
                  {{ isEditing ? 'Save Changes' : 'Create Employee' }}
                </button>
              </div>
            </div>

          </form>

        </div>
      </div>

    </div>
  `
})
export class EmployeeDirectoryComponent implements OnInit {
  employees: User[] = [];
  filteredEmployees: User[] = [];
  searchQuery = '';
  selectedDept = 'All';
  selectedRole = 'All';

  showModal = false;
  isEditing = false;
  showModalPassword = false;
  modalData: any = {};

  constructor(
    private employeeService: EmployeeService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.loadEmployees();
  }

  loadEmployees() {
    this.employeeService.getAllEmployees().subscribe({
      next: (res) => {
        this.employees = res.employees || [];
        this.filterEmployees();
      },
      error: () => {
        this.toast.error('Failed to load employee directory.');
      }
    });
  }

  filterEmployees() {
    let list = [...this.employees];

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(e => 
        e.fullName.toLowerCase().includes(q) || 
        e.email.toLowerCase().includes(q) || 
        e.username.toLowerCase().includes(q) ||
        (e.employeeId && e.employeeId.includes(q))
      );
    }

    if (this.selectedDept !== 'All') {
      list = list.filter(e => e.department === this.selectedDept);
    }

    if (this.selectedRole !== 'All') {
      list = list.filter(e => e.role === this.selectedRole);
    }

    this.filteredEmployees = list;
  }

  onSalaryChanged(emp: User) {
    this.employeeService.updateBaseSalary(emp._id, emp.baseSalary).subscribe({
      next: (res) => {
        this.toast.success(res.message);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to update base salary.');
      }
    });
  }

  toggleStatus(emp: User) {
    this.employeeService.toggleEmployeeStatus(emp._id).subscribe({
      next: (res) => {
        emp.isActive = res.isActive;
        this.toast.success(res.message);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to toggle status.');
      }
    });
  }

  openAddModal() {
    this.isEditing = false;
    this.showModalPassword = false;
    this.modalData = {
      fullName: '',
      employeeId: Math.floor(1000 + Math.random() * 9000).toString(),
      username: '',
      email: '',
      password: '',
      phone: '',
      role: 'employee',
      department: 'Software Engineering',
      designation: 'Financial Analyst',
      baseSalary: 50000
    };
    this.showModal = true;
  }

  openEditModal(emp: User) {
    this.isEditing = true;
    this.showModalPassword = false;
    this.modalData = {
      _id: emp._id,
      fullName: emp.fullName,
      employeeId: emp.employeeId || '',
      username: emp.username,
      email: emp.email,
      phone: emp.phone || '',
      role: emp.role,
      department: emp.department,
      designation: emp.designation,
      baseSalary: emp.baseSalary,
      password: ''
    };
    this.showModal = true;
  }

  saveModalData() {
    if (!this.modalData.username) {
      this.modalData.username = (this.modalData.email || '').split('@')[0];
    }

    if (this.isEditing) {
      this.employeeService.updateEmployee(this.modalData._id, this.modalData).subscribe({
        next: (res) => {
          this.toast.success(this.modalData.password ? 'Employee details and password updated!' : 'Employee details updated!');
          this.showModal = false;
          this.loadEmployees();
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Failed to update employee.');
        }
      });
    } else {
      this.employeeService.createEmployee(this.modalData).subscribe({
        next: () => {
          this.toast.success('Employee created successfully.');
          this.showModal = false;
          this.loadEmployees();
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Failed to create employee.');
        }
      });
    }
  }

  deleteEmployee(emp: any) {
    if (!emp || !emp._id) return;
    if (!confirm(`Are you sure you want to delete employee "${emp.fullName}"? This will permanently remove their profile, attendance, and payroll records.`)) {
      return;
    }
    this.employeeService.deleteEmployee(emp._id).subscribe({
      next: (res) => {
        this.toast.success(res.message || 'Employee deleted successfully.');
        this.showModal = false;
        this.loadEmployees();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to delete employee.');
      }
    });
  }
}
