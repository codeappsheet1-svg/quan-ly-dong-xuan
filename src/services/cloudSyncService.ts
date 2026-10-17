/**
 * Cloud Sync Service with Firebase Firestore & Authentication
 * Trường Tiểu học & THCS Đồng Xuân
 * Hiệu trưởng: Nguyễn Quốc Bảo (codeappsheet1@gmail.com)
 */

import {
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  query,
  limit,
} from 'firebase/firestore';
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { db, auth, googleProvider, handleFirestoreError, OperationType } from './firebase';
import { storageService } from './storageService';
import {
  UserAccount,
  LeaveRequest,
  FacilityRepairProposal,
  InternalExpenseItem,
  WorkWorkflowItem,
  WorkflowStepStatus,
  SchoolClass,
  StudentTransferReport,
  StudentAbsenceRequest,
  CashbookEntry,
  SchoolFeedbackItem,
  SchoolPublicArticle,
} from '../types/school';
import {
  INITIAL_CLASSES,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_FACILITY_PROPOSALS,
  INITIAL_INTERNAL_EXPENSES,
  INITIAL_WORKFLOW_ITEMS,
  INITIAL_STUDENT_TRANSFERS,
  INITIAL_STUDENT_ABSENCE_REQUESTS,
  INITIAL_CASHBOOK_ENTRIES,
  INITIAL_FEEDBACKS,
  INITIAL_PUBLIC_ARTICLES,
} from '../data/initialData';

export type SyncStatus = 'CONNECTING' | 'CONNECTED' | 'SYNCING' | 'OFFLINE';

class CloudSyncService {
  private syncStatus: SyncStatus = 'CONNECTING';
  private statusListeners: Array<(status: SyncStatus) => void> = [];
  private dataChangeListeners: Array<() => void> = [];
  private initialized = false;
  private isRemoteUpdate = false;

  public getStatus(): SyncStatus {
    return this.syncStatus;
  }

  public onStatusChange(callback: (status: SyncStatus) => void) {
    this.statusListeners.push(callback);
    callback(this.syncStatus);
    return () => {
      this.statusListeners = this.statusListeners.filter((cb) => cb !== callback);
    };
  }

  public onDataChange(callback: () => void) {
    this.dataChangeListeners.push(callback);
    return () => {
      this.dataChangeListeners = this.dataChangeListeners.filter((cb) => cb !== callback);
    };
  }

  private setStatus(newStatus: SyncStatus) {
    this.syncStatus = newStatus;
    this.statusListeners.forEach((cb) => cb(newStatus));
  }

  private notifyDataChanged() {
    this.dataChangeListeners.forEach((cb) => cb());
  }

  /**
   * Initialize Firestore listeners and seed initial data if collections are empty
   */
  public async initializeCloudSync() {
    if (this.initialized) return;
    this.initialized = true;

    try {
      this.setStatus('CONNECTING');

      // Hook local storage mutations to automatically sync to Firestore Cloud
      storageService.onSave((type, data, year) => {
        this.handleStorageSave(type, data, year);
      });

      // Setup Auth State Listener
      onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          console.log('Firebase Auth User connected:', firebaseUser.email);
          this.handleFirebaseUserLogin(firebaseUser);
        }
      });

      // Real-time subscriptions to Firestore collections
      this.subscribeClasses();
      this.subscribeLeaveRequests();
      this.subscribeFacilityProposals();
      this.subscribeInternalExpenses();
      this.subscribeWorkflows();
      this.subscribeStudentTransfers();
      this.subscribeStudentAbsences();
      this.subscribeCashbook();
      this.subscribeFeedbacks();
      this.subscribePublicArticles();

      // Check and seed initial cloud data
      await this.seedInitialCloudData();

      this.setStatus('CONNECTED');
    } catch (error) {
      console.warn('Could not initialize Firebase Cloud Sync fully, using offline storage:', error);
      this.setStatus('OFFLINE');
    }
  }

  /**
   * Automatically push local storage changes to Firestore Cloud
   */
  private async handleStorageSave(type: string, data: any, year?: string) {
    if (this.isRemoteUpdate) return;
    try {
      if (type === 'classes' && Array.isArray(data)) {
        for (const cls of data) {
          if (cls && cls.id) {
            await setDoc(doc(db, 'classes', cls.id), cls, { merge: true });
          }
        }
      } else if (type === 'leaves' && Array.isArray(data)) {
        for (const item of data) {
          if (item && item.id) {
            await setDoc(doc(db, 'leaveRequests', item.id), item, { merge: true });
          }
        }
      } else if (type === 'facilities' && Array.isArray(data)) {
        for (const item of data) {
          if (item && item.id) {
            await setDoc(doc(db, 'facilityProposals', item.id), item, { merge: true });
          }
        }
      } else if (type === 'internalExpenses' && Array.isArray(data)) {
        for (const item of data) {
          if (item && item.id) {
            await setDoc(doc(db, 'internalExpenses', item.id), item, { merge: true });
          }
        }
      } else if (type === 'workflows' && Array.isArray(data)) {
        for (const item of data) {
          if (item && item.id) {
            await setDoc(doc(db, 'workWorkflowItems', item.id), item, { merge: true });
          }
        }
      } else if (type === 'studentTransfers' && Array.isArray(data)) {
        for (const item of data) {
          if (item && item.id) {
            await setDoc(doc(db, 'studentTransfers', item.id), item, { merge: true });
          }
        }
      } else if (type === 'studentAbsences' && Array.isArray(data)) {
        for (const item of data) {
          if (item && item.id) {
            await setDoc(doc(db, 'studentAbsences', item.id), item, { merge: true });
          }
        }
      } else if (type === 'cashbook' && Array.isArray(data)) {
        for (const item of data) {
          if (item && item.id) {
            await setDoc(doc(db, 'cashbookEntries', item.id), item, { merge: true });
          }
        }
      } else if (type === 'feedbacks' && Array.isArray(data)) {
        for (const item of data) {
          if (item && item.id) {
            await setDoc(doc(db, 'feedbacks', item.id), item, { merge: true });
          }
        }
      } else if (type === 'publicArticles' && Array.isArray(data)) {
        for (const item of data) {
          if (item && item.id) {
            await setDoc(doc(db, 'publicArticles', item.id), item, { merge: true });
          }
        }
      } else if (type === 'staff' && Array.isArray(data)) {
        for (const item of data) {
          if (item && item.account && item.account.id) {
            await setDoc(doc(db, 'users', item.account.id), {
              ...item.account,
              sheetDataAZ: item.sheetDataAZ || {},
              updatedAt: new Date().toISOString(),
            }, { merge: true });
          }
        }
      }
    } catch (err) {
      console.warn('Sync to cloud notice:', err);
    }
  }

  /**
   * Handle Google Login / Firebase Auth
   */
  public async loginWithGoogle(): Promise<UserAccount> {
    try {
      this.setStatus('SYNCING');
      const credential = await signInWithPopup(auth, googleProvider);
      const firebaseUser = credential.user;
      const user = await this.handleFirebaseUserLogin(firebaseUser);
      this.setStatus('CONNECTED');
      return user;
    } catch (error) {
      this.setStatus('CONNECTED');
      console.error('Lỗi đăng nhập Google:', error);
      throw error;
    }
  }

  public async logout(): Promise<void> {
    try {
      await firebaseSignOut(auth);
      storageService.setCurrentUser(null);
      this.notifyDataChanged();
    } catch (error) {
      console.error('Lỗi đăng xuất:', error);
    }
  }

  private async handleFirebaseUserLogin(firebaseUser: FirebaseUser): Promise<UserAccount> {
    const staffList = storageService.getStaffList();
    const email = firebaseUser.email?.toLowerCase() || '';

    // If principal email or codeappsheet1@gmail.com
    let matchedStaff = staffList.find(
      (s) => s.account.email?.toLowerCase() === email || (email.includes('codeappsheet1') && s.account.role === 'HT')
    );

    let userAccount: UserAccount;

    if (matchedStaff) {
      userAccount = {
        ...matchedStaff.account,
        avatar: firebaseUser.photoURL || matchedStaff.account.avatar,
      };
    } else {
      const isPrincipal = email === 'codeappsheet1@gmail.com' || email.includes('hieutruong');
      if (isPrincipal) {
        userAccount = {
          ...staffList[0].account,
          email: firebaseUser.email || staffList[0].account.email,
          avatar: firebaseUser.photoURL || staffList[0].account.avatar,
        };
      } else {
        userAccount = {
          id: `GV_${Date.now().toString().slice(-4)}`,
          username: firebaseUser.email ? firebaseUser.email.split('@')[0] : 'giaovien',
          name: firebaseUser.displayName || 'Cán bộ Giáo viên',
          role: 'GV',
          position: 'Giáo viên Giảng dạy',
          email: firebaseUser.email || '',
          phone: firebaseUser.phoneNumber || '0987654321',
          campusId: 'CS1_TRU_SO',
          campusName: 'Trụ sở chính Đồng Xuân',
          branchName: 'Khu trung tâm',
          driveFolderId: '',
          sheetFileId: '',
          sheetUrl: '',
          avatar: firebaseUser.photoURL || undefined,
          status: 'ACTIVE',
        };
      }
    }

    storageService.setCurrentUser(userAccount);

    // Save profile to Firestore
    try {
      await setDoc(doc(db, 'users', userAccount.id), {
        id: userAccount.id,
        username: userAccount.username,
        name: userAccount.name,
        role: userAccount.role,
        position: userAccount.position,
        email: userAccount.email || '',
        phone: userAccount.phone || '',
        campusId: userAccount.campusId,
        campusName: userAccount.campusName,
        branchName: userAccount.branchName,
        status: userAccount.status || 'ACTIVE',
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${userAccount.id}`);
    }

    this.notifyDataChanged();
    return userAccount;
  }

  /**
   * Seed initial data to cloud if collections are empty
   */
  private async seedInitialCloudData() {
    try {
      // 1. Leave Requests
      const leavesSnap = await getDocs(query(collection(db, 'leaveRequests'), limit(1)));
      if (leavesSnap.empty) {
        for (const item of INITIAL_LEAVE_REQUESTS) {
          await setDoc(doc(db, 'leaveRequests', item.id), item);
        }
      }

      // 2. Facility Proposals
      const facSnap = await getDocs(query(collection(db, 'facilityProposals'), limit(1)));
      if (facSnap.empty) {
        for (const item of INITIAL_FACILITY_PROPOSALS) {
          await setDoc(doc(db, 'facilityProposals', item.id), item);
        }
      }

      // 3. Internal Expenses
      const expSnap = await getDocs(query(collection(db, 'internalExpenses'), limit(1)));
      if (expSnap.empty) {
        for (const item of INITIAL_INTERNAL_EXPENSES) {
          await setDoc(doc(db, 'internalExpenses', item.id), item);
        }
      }

      // 4. Workflows
      const wfSnap = await getDocs(query(collection(db, 'workWorkflowItems'), limit(1)));
      if (wfSnap.empty) {
        for (const item of INITIAL_WORKFLOW_ITEMS) {
          await setDoc(doc(db, 'workWorkflowItems', item.id), item);
        }
      }

      // 5. Classes
      const classSnap = await getDocs(query(collection(db, 'classes'), limit(1)));
      if (classSnap.empty && INITIAL_CLASSES.length > 0) {
        for (const item of INITIAL_CLASSES.slice(0, 15)) {
          await setDoc(doc(db, 'classes', item.id), item);
        }
      }
    } catch (error) {
      console.warn('Initial data seeding note:', error);
    }
  }

  /**
   * Real-time listener for Classes
   */
  private subscribeClasses() {
    try {
      const q = collection(db, 'classes');
      onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const classesMap = new Map<string, SchoolClass>();
            const activeYear = storageService.getActiveSchoolYear();
            const currentClasses = storageService.getClasses(activeYear);
            currentClasses.forEach((c) => classesMap.set(c.id, c));

            snapshot.forEach((d) => {
              const cls = d.data() as SchoolClass;
              if (cls && cls.id) {
                classesMap.set(cls.id, cls);
              }
            });

            this.isRemoteUpdate = true;
            storageService.saveClasses(Array.from(classesMap.values()), activeYear);
            this.isRemoteUpdate = false;
            this.notifyDataChanged();
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'classes');
        }
      );
    } catch (err) {
      console.warn('Classes subscription note:', err);
    }
  }

  /**
   * Real-time listener for Leave Requests
   */
  private subscribeLeaveRequests() {
    try {
      const q = collection(db, 'leaveRequests');
      onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const leaves: LeaveRequest[] = [];
            snapshot.forEach((d) => {
              leaves.push(d.data() as LeaveRequest);
            });
            const activeYear = storageService.getActiveSchoolYear();
            this.isRemoteUpdate = true;
            storageService.saveLeaves(leaves, activeYear);
            this.isRemoteUpdate = false;
            this.notifyDataChanged();
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'leaveRequests');
        }
      );
    } catch (err) {
      console.warn('Leave requests subscription note:', err);
    }
  }

  /**
   * Real-time listener for Facility Proposals
   */
  private subscribeFacilityProposals() {
    try {
      const q = collection(db, 'facilityProposals');
      onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const facilities: FacilityRepairProposal[] = [];
            snapshot.forEach((d) => {
              facilities.push(d.data() as FacilityRepairProposal);
            });
            this.isRemoteUpdate = true;
            storageService.saveFacilities(facilities);
            this.isRemoteUpdate = false;
            this.notifyDataChanged();
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'facilityProposals');
        }
      );
    } catch (err) {
      console.warn('Facility proposals subscription note:', err);
    }
  }

  /**
   * Real-time listener for Internal Expenses
   */
  private subscribeInternalExpenses() {
    try {
      const q = collection(db, 'internalExpenses');
      onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const expenses: InternalExpenseItem[] = [];
            snapshot.forEach((d) => {
              expenses.push(d.data() as InternalExpenseItem);
            });
            const activeYear = storageService.getActiveSchoolYear();
            this.isRemoteUpdate = true;
            storageService.saveInternalExpenses(expenses, activeYear);
            this.isRemoteUpdate = false;
            this.notifyDataChanged();
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'internalExpenses');
        }
      );
    } catch (err) {
      console.warn('Internal expenses subscription note:', err);
    }
  }

  /**
   * Real-time listener for Workflows
   */
  private subscribeWorkflows() {
    try {
      const q = collection(db, 'workWorkflowItems');
      onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const items: WorkWorkflowItem[] = [];
            snapshot.forEach((d) => {
              items.push(d.data() as WorkWorkflowItem);
            });
            const activeYear = storageService.getActiveSchoolYear();
            this.isRemoteUpdate = true;
            storageService.saveWorkflows(items, activeYear);
            this.isRemoteUpdate = false;
            this.notifyDataChanged();
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'workWorkflowItems');
        }
      );
    } catch (err) {
      console.warn('Workflow items subscription note:', err);
    }
  }

  /**
   * Real-time listener for Student Transfers
   */
  private subscribeStudentTransfers() {
    try {
      const q = collection(db, 'studentTransfers');
      onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const transfers: StudentTransferReport[] = [];
            snapshot.forEach((d) => {
              transfers.push(d.data() as StudentTransferReport);
            });
            const activeYear = storageService.getActiveSchoolYear();
            this.isRemoteUpdate = true;
            storageService.saveStudentTransfers(transfers, activeYear);
            this.isRemoteUpdate = false;
            this.notifyDataChanged();
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'studentTransfers');
        }
      );
    } catch (err) {
      console.warn('Student transfers subscription note:', err);
    }
  }

  /**
   * Real-time listener for Student Absences
   */
  private subscribeStudentAbsences() {
    try {
      const q = collection(db, 'studentAbsences');
      onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const absences: StudentAbsenceRequest[] = [];
            snapshot.forEach((d) => {
              absences.push(d.data() as StudentAbsenceRequest);
            });
            const activeYear = storageService.getActiveSchoolYear();
            this.isRemoteUpdate = true;
            storageService.saveStudentAbsences(absences, activeYear);
            this.isRemoteUpdate = false;
            this.notifyDataChanged();
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'studentAbsences');
        }
      );
    } catch (err) {
      console.warn('Student absences subscription note:', err);
    }
  }

  /**
   * Real-time listener for Cashbook
   */
  private subscribeCashbook() {
    try {
      const q = collection(db, 'cashbookEntries');
      onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const entries: CashbookEntry[] = [];
            snapshot.forEach((d) => {
              entries.push(d.data() as CashbookEntry);
            });
            const activeYear = storageService.getActiveSchoolYear();
            this.isRemoteUpdate = true;
            storageService.saveCashbookEntries(entries, activeYear);
            this.isRemoteUpdate = false;
            this.notifyDataChanged();
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'cashbookEntries');
        }
      );
    } catch (err) {
      console.warn('Cashbook subscription note:', err);
    }
  }

  /**
   * Real-time listener for Feedbacks
   */
  private subscribeFeedbacks() {
    try {
      const q = collection(db, 'feedbacks');
      onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const feedbacks: SchoolFeedbackItem[] = [];
            snapshot.forEach((d) => {
              feedbacks.push(d.data() as SchoolFeedbackItem);
            });
            const activeYear = storageService.getActiveSchoolYear();
            this.isRemoteUpdate = true;
            storageService.saveFeedbacks(feedbacks, activeYear);
            this.isRemoteUpdate = false;
            this.notifyDataChanged();
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'feedbacks');
        }
      );
    } catch (err) {
      console.warn('Feedbacks subscription note:', err);
    }
  }

  /**
   * Real-time listener for Public Articles
   */
  private subscribePublicArticles() {
    try {
      const q = collection(db, 'publicArticles');
      onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const articles: SchoolPublicArticle[] = [];
            snapshot.forEach((d) => {
              articles.push(d.data() as SchoolPublicArticle);
            });
            const activeYear = storageService.getActiveSchoolYear();
            this.isRemoteUpdate = true;
            storageService.savePublicArticles(articles, activeYear);
            this.isRemoteUpdate = false;
            this.notifyDataChanged();
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'publicArticles');
        }
      );
    } catch (err) {
      console.warn('Public articles subscription note:', err);
    }
  }

  // --- Real-time Cloud Operations with Real Approvals ---

  /**
   * Tạo đơn xin nghỉ phép thật trên Firestore Cloud
   */
  public async submitLeaveRequest(
    leave: Omit<LeaveRequest, 'id' | 'createdAt' | 'status'> & { id?: string }
  ): Promise<LeaveRequest> {
    const id = leave.id || `NP_${Date.now().toString().slice(-6)}`;
    const newLeave: LeaveRequest = {
      ...leave,
      id,
      status: 'Chờ duyệt',
      createdAt: new Date().toISOString().split('T')[0],
      isPublic: true,
    };

    const activeYear = storageService.getActiveSchoolYear();
    const currentLeaves = storageService.getLeaves(activeYear);
    storageService.saveLeaves([newLeave, ...currentLeaves], activeYear);

    try {
      await setDoc(doc(db, 'leaveRequests', id), newLeave);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `leaveRequests/${id}`);
    }

    this.notifyDataChanged();
    return newLeave;
  }

  /**
   * Ban Giám hiệu (HT hoặc PHT phụ trách phân hiệu) duyệt nghỉ phép
   */
  public async approveLeaveRequest(
    leaveId: string,
    status: 'Đã phê duyệt' | 'Từ chối',
    approver: UserAccount,
    approvalComment?: string
  ): Promise<boolean> {
    const activeYear = storageService.getActiveSchoolYear();
    const currentLeaves = storageService.getLeaves(activeYear);
    const target = currentLeaves.find((l) => l.id === leaveId);
    if (!target) return false;

    const approverRoleTitle = approver.role === 'HT' ? 'Hiệu trưởng' : 'Phó Hiệu trưởng';
    const updatedLeave: LeaveRequest = {
      ...target,
      status,
      approvedBy: approver.name,
      approvalDate: new Date().toISOString().split('T')[0],
      approvalComment:
        approvalComment ||
        (status === 'Đã phê duyệt'
          ? `${approverRoleTitle} ${approver.name} phê chuẩn.`
          : 'Chưa phù hợp kế hoạch giảng dạy.'),
    };

    const nextList = currentLeaves.map((l) => (l.id === leaveId ? updatedLeave : l));
    storageService.saveLeaves(nextList, activeYear);

    try {
      await setDoc(doc(db, 'leaveRequests', leaveId), updatedLeave, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `leaveRequests/${leaveId}`);
    }

    storageService.addSyncLog(
      status === 'Đã phê duyệt' ? `${approverRoleTitle} phê duyệt nghỉ phép` : `${approverRoleTitle} từ chối nghỉ phép`,
      `${approverRoleTitle} ${approver.name} đã ${status === 'Đã phê duyệt' ? 'phê duyệt' : 'từ chối'} đơn nghỉ phép của ${target.userName} (${target.startDate} đến ${target.endDate})`
    );

    this.notifyDataChanged();
    return true;
  }

  /**
   * Tạo đề xuất sửa chữa / cơ sở vật chất thật trên Cloud
   */
  public async submitFacilityProposal(
    proposal: Omit<FacilityRepairProposal, 'id' | 'createdAt' | 'approvalStatus' | 'executionStatus'> & { id?: string }
  ): Promise<FacilityRepairProposal> {
    const id = proposal.id || `CSVC_${Date.now().toString().slice(-6)}`;
    const newProposal: FacilityRepairProposal = {
      ...proposal,
      id,
      approvalStatus: 'Chờ HT duyệt',
      executionStatus: 'Chưa thực hiện',
      createdAt: new Date().toISOString().split('T')[0],
    };

    const currentProposals = storageService.getFacilities();
    storageService.saveFacilities([newProposal, ...currentProposals]);

    try {
      await setDoc(doc(db, 'facilityProposals', id), newProposal);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `facilityProposals/${id}`);
    }

    this.notifyDataChanged();
    return newProposal;
  }

  /**
   * Hiệu trưởng duyệt đề xuất cơ sở vật chất trên Cloud
   */
  public async approveFacilityProposal(
    proposalId: string,
    status: 'Đã duyệt' | 'Không duyệt',
    approver: UserAccount,
    htComment?: string
  ): Promise<boolean> {
    const currentProposals = storageService.getFacilities();
    const target = currentProposals.find((p) => p.id === proposalId);
    if (!target) return false;

    const updatedProposal: FacilityRepairProposal = {
      ...target,
      approvalStatus: status,
      approvedBudget: target.approvedBudget || target.estimatedCost,
      htComment: htComment || (status === 'Đã duyệt' ? 'Hiệu trưởng duyệt kinh phí sửa chữa' : 'Chưa cấp thiết'),
      approvalDate: new Date().toISOString().split('T')[0],
      executionStatus: status === 'Đã duyệt' ? 'Đang sửa chữa' : target.executionStatus,
    };

    const nextList = currentProposals.map((p) => (p.id === proposalId ? updatedProposal : p));
    storageService.saveFacilities(nextList);

    try {
      await setDoc(doc(db, 'facilityProposals', proposalId), updatedProposal, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `facilityProposals/${proposalId}`);
    }

    storageService.addSyncLog(
      status === 'Đã duyệt' ? 'HT Duyệt đề xuất CSVC' : 'HT Xử lý đề xuất CSVC',
      `Hiệu trưởng ${approver.name} đã cập nhật trạng thái đề xuất: ${target.title} (${status})`
    );

    this.notifyDataChanged();
    return true;
  }

  /**
   * Tạo đề nghị thanh toán / chi nội bộ thật trên Cloud
   */
  public async submitInternalExpense(
    expense: Omit<InternalExpenseItem, 'id' | 'approvalStatus' | 'settlementStatus' | 'isClosed'> & { id?: string }
  ): Promise<InternalExpenseItem> {
    const id = expense.id || `PC_${Date.now().toString().slice(-6)}`;
    const newExpense: InternalExpenseItem = {
      ...expense,
      id,
      approvalStatus: 'CHO_HT_DUYET',
      settlementStatus: 'CHUA_THANH_TOAN',
      isClosed: false,
    };

    const activeYear = storageService.getActiveSchoolYear();
    const currentExpenses = storageService.getInternalExpenses(activeYear);
    storageService.saveInternalExpenses([newExpense, ...currentExpenses], activeYear);

    try {
      await setDoc(doc(db, 'internalExpenses', id), newExpense);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `internalExpenses/${id}`);
    }

    this.notifyDataChanged();
    return newExpense;
  }

  /**
   * Hiệu trưởng duyệt phiếu chi nội bộ trên Cloud
   */
  public async approveInternalExpense(
    expenseId: string,
    status: 'HT_DA_DUYET' | 'HT_TU_CHOI',
    approver: UserAccount,
    principalNote?: string
  ): Promise<boolean> {
    const activeYear = storageService.getActiveSchoolYear();
    const currentExpenses = storageService.getInternalExpenses(activeYear);
    const target = currentExpenses.find((e) => e.id === expenseId);
    if (!target) return false;

    const updatedExpense: InternalExpenseItem = {
      ...target,
      approvalStatus: status,
      approvedById: approver.id,
      approvedByName: approver.name,
      approvedAt: new Date().toISOString(),
      principalNote: principalNote || (status === 'HT_DA_DUYET' ? 'Hiệu trưởng duyệt chuẩn chi' : 'Từ chối thanh toán'),
    };

    const nextList = currentExpenses.map((e) => (e.id === expenseId ? updatedExpense : e));
    storageService.saveInternalExpenses(nextList, activeYear);

    try {
      await setDoc(doc(db, 'internalExpenses', expenseId), updatedExpense, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `internalExpenses/${expenseId}`);
    }

    storageService.addSyncLog(
      status === 'HT_DA_DUYET' ? 'HT Chuẩn chi tài chính' : 'HT Từ chối chuẩn chi',
      `Hiệu trưởng ${approver.name} đã ${status === 'HT_DA_DUYET' ? 'duyệt chi' : 'từ chối'}: ${target.title} (${target.amount.toLocaleString()} đ)`
    );

    this.notifyDataChanged();
    return true;
  }

  /**
   * Tạo văn bản / quy trình công việc 6 bước trên Cloud
   */
  public async submitWorkflowItem(
    item: Omit<WorkWorkflowItem, 'id' | 'status' | 'executionProgress'> & { id?: string }
  ): Promise<WorkWorkflowItem> {
    const id = item.id || `CV_${Date.now().toString().slice(-6)}`;
    const newItem: WorkWorkflowItem = {
      ...item,
      id,
      status: 'B1_CHO_HT_DUYET',
      executionProgress: 0,
    };

    const activeYear = storageService.getActiveSchoolYear();
    const currentItems = storageService.getWorkflows(activeYear);
    storageService.saveWorkflows([newItem, ...currentItems], activeYear);

    try {
      await setDoc(doc(db, 'workWorkflowItems', id), newItem);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `workWorkflowItems/${id}`);
    }

    this.notifyDataChanged();
    return newItem;
  }

  /**
   * Hiệu trưởng duyệt / chuyển bước quy trình công việc 6 bước
   */
  public async advanceWorkflowItem(
    itemId: string,
    newStatus: WorkflowStepStatus,
    approver: UserAccount,
    directives?: string
  ): Promise<boolean> {
    const activeYear = storageService.getActiveSchoolYear();
    const currentItems = storageService.getWorkflows(activeYear);
    const target = currentItems.find((w) => w.id === itemId);
    if (!target) return false;

    const updatedItem: WorkWorkflowItem = {
      ...target,
      status: newStatus,
      approvedAt: new Date().toISOString(),
      approvedById: approver.id,
      approvedByName: approver.name,
      approvalDirectives: directives || target.approvalDirectives,
      executionProgress: newStatus === 'B5_HT_DA_DANH_GIA' ? 100 : target.executionProgress,
    };

    const nextList = currentItems.map((w) => (w.id === itemId ? updatedItem : w));
    storageService.saveWorkflows(nextList, activeYear);

    try {
      await setDoc(doc(db, 'workWorkflowItems', itemId), updatedItem, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `workWorkflowItems/${itemId}`);
    }

    storageService.addSyncLog(
      'Cập nhật tiến độ quy trình',
      `Hiệu trưởng ${approver.name} đã chuyển trạng thái công việc ${target.title} sang: ${newStatus}`
    );

    this.notifyDataChanged();
    return true;
  }
}

export const cloudSyncService = new CloudSyncService();
