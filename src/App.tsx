/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect, useRef, ChangeEvent, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileUp, 
  CheckCircle2, 
  Table as TableIcon, 
  AlertCircle, 
  Loader2, 
  RefreshCcw, 
  Download, 
  ArrowRight,
  Plus,
  X,
  FileText,
  Image as ImageIcon,
  LogIn,
  LogOut,
  History,
  Save,
  User as UserIcon,
  Key,
  Trash2,
  MessageSquare,
  Moon,
  Sun,
  BarChart3,
  Printer,
  FileSpreadsheet
} from 'lucide-react';
import { utils, writeFile } from 'xlsx';
import { FinancialData, extractFinancialData, extractFinancialDataBatch } from './services/gemini';
import { computeFinancialModel } from './services/financialModel';
import { generatePowerBiExcelWorkbook } from './services/powerBiGenerator';
import PowerBIDashboard from './components/PowerBIDashboard';
import DashboardAICopilot from './components/DashboardAICopilot';
import { exportDashboardToPdf } from './services/pdfExportService';
import { auth, db } from './firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendEmailVerification,
  User
} from 'firebase/auth';
import { 
  setDocument,
  getDocument
} from './services/firestoreService';
import { Timestamp, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import ErrorBoundary from './components/ErrorBoundary';

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

type Step = 'upload' | 'review' | 'output' | 'history' | 'messages';

interface UploadedFile {
  file: File;
  year: string;
  id: string;
  status: 'idle' | 'extracting' | 'success' | 'error';
  data?: FinancialData;
  error?: string;
}

export default function App() {
  return (
    <ErrorBoundary>
      <FinSpreadApp />
    </ErrorBoundary>
  );
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`bg-slate-200 dark:bg-slate-800 rounded-lg relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 animate-shimmer" />
    </div>
  );
}

function FinSpreadApp() {
  const [step, setStep] = useState<Step>('upload');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadType, setUploadType] = useState<'pdf' | 'image'>('pdf');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [savedStatements, setSavedStatements] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [supportMessages, setSupportMessages] = useState<any[]>([]);
  const [loadingMessage, setLoadingMessage] = useState('Initializing extraction...');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isUpdatePasswordOpen, setIsUpdatePasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isExportingPbix, setIsExportingPbix] = useState(false);
  const [pbixSuccessModal, setPbixSuccessModal] = useState<{ open: boolean; companyName: string; fileName: string } | null>(null);
  const [showWebDashboard, setShowWebDashboard] = useState(false);
  const [dashboardCompact, setDashboardCompact] = useState(true);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      // Default to false (light mode) if no preference is saved
      return saved === 'true';
    }
    return false;
  });

  const isAdmin = user?.email === 'mostafa.elzeiny11@gmail.com';
  const isCompanyUser = user?.emailVerified || isAdmin;
  const userPlan = isAdmin ? 'System Architect' : (isCompanyUser ? 'True Lease Pro User' : 'Free Trial User');

  // Check if user needs verification
  const needsVerification = user && !user.emailVerified && !isAdmin;

  useEffect(() => {
    // Only apply dark mode if user is logged in and not in the verification step
    // This ensures the Sign In / Sign Up pages are always in light mode as requested
    const isAuthPage = !user || needsVerification;
    
    if (darkMode && !isAuthPage) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Save preference to localStorage
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode, user, needsVerification]);

  const resetApp = () => {
    setStep('upload');
    setUploadedFiles([]);
    setIsProcessing(false);
    setLoadingMessage('Initializing extraction...');
  };

  // Fetch support messages for admin
  useEffect(() => {
    if (isAdmin && step === 'messages') {
      const unsubscribe = onSnapshot(
        query(collection(db, 'support_messages'), orderBy('createdAt', 'desc')),
        (snapshot) => {
          const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setSupportMessages(msgs);
        },
        (error) => {
          console.error("Error fetching messages:", error);
        }
      );
      return () => unsubscribe();
    }
  }, [isAdmin, step]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
      
      if (currentUser) {
        // Sync user profile to Firestore
        setDocument('users', currentUser.uid, {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          role: isAdmin ? 'admin' : 'user',
          plan: isAdmin ? 'architect' : (isCompanyUser ? 'company' : 'free'),
          updatedAt: Timestamp.now()
        }).catch(console.error);
      }
    });
    return () => unsubscribe();
  }, []);

  // Session History: No Firestore subscription, history is local to the session
  useEffect(() => {
    // History is now handled locally in startExtraction
  }, [user]);

  const sortedFiles = useMemo(() => {
    return [...uploadedFiles]
      .filter(f => f.status === 'success' && f.data)
      .sort((a, b) => (a.data?.year || 0) - (b.data?.year || 0));
  }, [uploadedFiles]);

  const sortedData = useMemo(() => {
    return sortedFiles.map(f => f.data!);
  }, [sortedFiles]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error('Login failed:', error);
      // If it's a domain error, we can't easily show it in AuthScreen without passing state
      // But we can at least alert for now or improve the AuthScreen to handle it
      if (error.code === 'auth/unauthorized-domain') {
        alert("This domain is not authorized in Firebase. Please add the app URL to 'Authorized domains' in Firebase Console.");
      } else {
        alert("Login failed: " + (error.message || "Unknown error"));
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setStep('upload');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };


  const addFiles = (filesList: File[]) => {
    if (filesList.length === 0) return;
    if (uploadedFiles.length + filesList.length > 3) {
      alert("Maximum 3 files allowed.");
      return;
    }

    const validFiles = filesList.filter(file => {
      if (uploadType === 'pdf') {
        return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      } else {
        return file.type.startsWith('image/');
      }
    });

    if (validFiles.length === 0) {
      alert(`Please upload valid ${uploadType.toUpperCase()} files.`);
      return;
    }

    const newFiles: UploadedFile[] = validFiles.map((file: File) => ({
      file,
      year: '',
      id: Math.random().toString(36).substr(2, 9),
      status: 'idle'
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addFiles(files);
    // Reset file input so selecting the same file again triggers onChange
    if (e.target) {
      e.target.value = '';
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles(uploadedFiles.filter(f => f.id !== id));
  };

  const startExtraction = async () => {
    if (!user) return;

    // Check daily limit for free users
    if (!isCompanyUser && !isAdmin) {
      const today = new Date().toISOString().split('T')[0];
      const userDoc = await getDocument('users', user.uid);
      const dailyUsage = userDoc?.dailyUsage || {};
      const todayCount = dailyUsage[today] || 0;
      
      if (todayCount + uploadedFiles.length > 10) {
        alert(`Daily limit reached! Free users can only upload 10 statements per day. You have already used ${todayCount} today.`);
        return;
      }
    }

    setStep('review');
    setIsProcessing(true);
    
    const messages = [
      'Scanning document structure...',
      'Identifying financial tables...',
      'Extracting Income Statement data...',
      'Mapping Balance Sheet items...',
      'Calculating totals and verifying accuracy...',
      'Finalizing data spread...'
    ];
    
    let msgIndex = 0;
    const interval = setInterval(() => {
      msgIndex = (msgIndex + 1) % messages.length;
      setLoadingMessage(messages[msgIndex]);
    }, 4000);

    const idleFiles = uploadedFiles.filter(f => f.status === 'idle');
    const results: { fileId: string; success: boolean; data?: FinancialData; year?: string }[] = [];
    
    for (let index = 0; index < idleFiles.length; index++) {
      const file = idleFiles[index];
      if (index > 0) {
        // Breather between files to avoid triggering Gemini 503 high demand / rate limits
        await new Promise(resolve => setTimeout(resolve, 1200));
      }
      
      setUploadedFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'extracting', error: undefined } : f));
      
      try {
        const rawData = await extractFinancialData(file.file);
        const data = recalculateFinancials(rawData);
        const yearStr = data.year?.toString() || 'Unknown';
        setUploadedFiles(prev => prev.map(f => f.id === file.id ? { 
          ...f, 
          data, 
          year: yearStr, 
          status: 'success',
          error: undefined 
        } : f));
        results.push({ fileId: file.id, success: true, data, year: yearStr });
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Extraction failed';
        setUploadedFiles(prev => prev.map(f => f.id === file.id ? { 
          ...f, 
          status: 'error', 
          error: errMsg 
        } : f));
        results.push({ fileId: file.id, success: false });
      }
    }

    clearInterval(interval);
    setIsProcessing(false);

    const successfulItems = results.filter(r => r.success && r.data);

    // Update daily usage for free users
    if (!isCompanyUser && !isAdmin) {
      const today = new Date().toISOString().split('T')[0];
      const userDoc = await getDocument('users', user.uid);
      const dailyUsage = userDoc?.dailyUsage || {};
      const todayCount = dailyUsage[today] || 0;
      
      const successfulCount = successfulItems.length;
      
      await setDocument('users', user.uid, {
        ...userDoc,
        dailyUsage: {
          ...dailyUsage,
          [today]: todayCount + successfulCount
        }
      });
    }

    // Automatically add to session history
    if (successfulItems.length > 0) {
      const sessionData = successfulItems.map(f => f.data!);
      const statementId = Math.random().toString(36).substr(2, 9);
      const newStatement = {
        id: statementId,
        companyName: 'Session Analysis',
        fiscalYear: successfulItems[successfulItems.length - 1].year || 'Unknown',
        data: sessionData,
        createdAt: { toDate: () => new Date() }
      };
      setSavedStatements(prev => [newStatement, ...prev]);
    }
  };

  const saveToHistory = async () => {
    if (sortedData.length === 0) return;
    
    setIsSaving(true);
    try {
      const statementId = Math.random().toString(36).substr(2, 9);
      const newStatement = {
        id: statementId,
        companyName: 'Manual Save',
        fiscalYear: sortedData[sortedData.length - 1].year,
        data: sortedData,
        createdAt: { toDate: () => new Date() }
      };
      
      // Add to local state history
      setSavedStatements(prev => [newStatement, ...prev]);
      
      // Also save to Firestore if user is logged in
      if (user) {
        await setDocument('statements', statementId, {
          ...newStatement,
          ownerUid: user.uid,
          createdAt: Timestamp.now()
        });
      }
      
      alert('Analysis saved to history!');
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save analysis.');
    } finally {
      setIsSaving(false);
    }
  };

  const reExtract = async (id: string) => {
    const targetFile = uploadedFiles.find(f => f.id === id);
    if (!targetFile) return;

    setUploadedFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'extracting', error: undefined } : f));

    try {
      const data = await extractFinancialData(targetFile.file, true);
      setUploadedFiles(prev => prev.map(f => f.id === id ? {
        ...f,
        data,
        year: data.year?.toString() || 'Unknown',
        status: 'success',
        error: undefined
      } : f));
    } catch (err) {
      setUploadedFiles(prev => prev.map(f => f.id === id ? {
        ...f,
        status: 'error',
        error: err instanceof Error ? err.message : 'Extraction failed'
      } : f));
    }
  };

  const formatCurrency = (val: number) => {
    // Scale by 1000 as requested (1,000,000 -> 1,000)
    // Using Math.trunc to match the EPIC standard of truncation
    const scaledVal = Math.trunc(val / 1000);
    const absVal = Math.abs(scaledVal);
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(absVal);

    return scaledVal < 0 ? `(${formatted})` : formatted;
  };

  const recalculateFinancials = (data: FinancialData): FinancialData => {
    const is = { ...data.incomeStatement };
    const bs = { ...data.balanceSheet };

    const n = (val: any) => (typeof val === 'number' && !isNaN(val) ? val : 0);

    // Income Statement Calculations
    is.grossProfit = n(is.revenues) - Math.abs(n(is.costOfGoodsSold)) - Math.abs(n(is.depreciation1));
    is.netOperatingProfit = n(is.grossProfit) - (Math.abs(n(is.depreciation2)) + Math.abs(n(is.sgaExpense)) + Math.abs(n(is.provisions1)) + Math.abs(n(is.rd)) + Math.abs(n(is.goodwillAmortization)) + Math.abs(n(is.otherAmortization)));
    is.netProfitBeforeTax = n(is.netOperatingProfit) - (Math.abs(n(is.grossInterestExpExist)) + Math.abs(n(is.interestExpNew)) + Math.abs(n(is.capitalizedInterest))) + 
                           (n(is.interestIncome) + n(is.dividendIncome) + n(is.provDoubtfulRec) + n(is.provisions2) + n(is.fxGL) + n(is.sundryIncomeExpense1));
    is.netProfitAfterTax = n(is.netProfitBeforeTax) - Math.abs(n(is.totalTaxExpense));
    is.npaui = n(is.netProfitAfterTax) - Math.abs(n(is.minorityInterestExpense)) + n(is.saleOfPlant) + n(is.sundryIncomeExpense2);
    is.totalChange = n(is.npaui) - Math.abs(n(is.prefShareDividends)) - Math.abs(n(is.commonStockDividends)) + n(is.otherAdjustment);

    // Balance Sheet Calculations
    bs.netReceivables = n(bs.accountsReceivable) - n(bs.lessAllowances);
    bs.totalInventory = n(bs.rawMaterials) + n(bs.workInProgress) + n(bs.finishedGoods) + n(bs.goodsInTransit);
    bs.totalCurrentAssets = n(bs.cash) + n(bs.marketableSecurities) + n(bs.marketableSecExcess) + n(bs.netReceivables) + n(bs.totalInventory) + n(bs.advancePayments) + n(bs.nonTradeRec) + n(bs.otherCurrentAssets) + n(bs.dueFromSisterCo1);
    bs.grossPlant = n(bs.land) + n(bs.buildingImprovement) + n(bs.machineryEquipment) + n(bs.constInProgress);
    bs.netPpe = n(bs.grossPlant) - n(bs.lessAccumulatedDep);
    bs.netIntangibles = n(bs.goodwill) + n(bs.otherIntangibleAsset) - n(bs.lessAccumAmortization);
    bs.totalAssets = n(bs.totalCurrentAssets) + n(bs.netPpe) + n(bs.accountsReceivablesLt) + n(bs.dueFromSisterCo2) + n(bs.otherTangibleAsset) + n(bs.deferredTaxAsset) + n(bs.prepaids) + n(bs.netIntangibles);

    bs.totCurrentLiabilities = n(bs.shortTermBorrowingExisting) + n(bs.shortTermBorrowingNew) + n(bs.cpSeniorDebtExisting) + n(bs.cpSeniorDebtNew) + n(bs.cpCapLease) + n(bs.cpSubDebtExisting) + n(bs.cpSalesTax) + n(bs.accountsPayable) + n(bs.taxesPayable) + n(bs.accruedExpenses) + n(bs.interestPayable) + n(bs.dividendsPayable) + n(bs.downPayments) + n(bs.dueToSisterCo3) + n(bs.otherCurrentLiability);
    bs.totalLongTermDebt = n(bs.ltLeaseObligation) + n(bs.ltSeniorDebtExisting) + n(bs.ltSeniorDebtNew) + n(bs.ltTaxes) + n(bs.ltSharholderLoan);
    bs.totalLiabilities = n(bs.totCurrentLiabilities) + n(bs.totalLongTermDebt) + n(bs.otherNonCurrentLiab);
    
    bs.totalGreyArea = n(bs.deferredTaxes) + n(bs.minorityInterest) + n(bs.provisions3);
    
    // Link Net Income to NPAUI
    bs.plusNetIncome = is.npaui;
    // Link Dividends to Pref + Common Dividends
    bs.lessDividends = n(is.prefShareDividends) + n(is.commonStockDividends);
    
    bs.retainedEarningsClosing = n(bs.retainedEarningsOpening) + n(bs.plusNetIncome) - n(bs.lessDividends) + n(bs.otherAdjustments);
    bs.totalEquity = n(bs.preferredStock) + n(bs.commonStock) + n(bs.additionalPaidInCapital) + n(bs.retainedEarningsClosing) + n(bs.ownersAccount) + n(bs.fxAdjustment) + n(bs.legalReserve);
    bs.totalLiabsAndEquity = n(bs.totalLiabilities) + n(bs.totalGreyArea) + n(bs.totalEquity);

    return { ...data, incomeStatement: is, balanceSheet: bs };
  };

  const handleValueChange = useCallback((fileId: string, section: 'incomeStatement' | 'balanceSheet', key: string, value: string) => {
    const numValue = (parseFloat(value) || 0) * 1000;
    setUploadedFiles(prev => {
      let hasChanges = false;
      const next = prev.map(f => {
        if (f.id !== fileId || !f.data) return f;
        
        const currentSection = f.data[section] as any;
        if (currentSection && currentSection[key] === numValue) {
          return f;
        }

        const newData = {
          ...f.data,
          [section]: {
            ...f.data[section],
            [key]: numValue
          }
        };
        
        hasChanges = true;
        return { ...f, data: recalculateFinancials(newData) };
      });
      return hasChanges ? next : prev;
    });
  }, []);

  const handleDashboardDataChange = useCallback((updated: FinancialData[]) => {
    setUploadedFiles(prev => {
      let hasChanges = false;
      const next = prev.map(f => {
        if (!f.data) return f;
        const matchingUpdated = updated.find(u => u.year === f.data?.year);
        if (matchingUpdated) {
          const recalculated = recalculateFinancials(matchingUpdated);
          if (JSON.stringify(f.data) !== JSON.stringify(recalculated)) {
            hasChanges = true;
            return {
              ...f,
              data: recalculated
            };
          }
        }
        return f;
      });
      return hasChanges ? next : prev;
    });
  }, []);

  const downloadExcel = () => {
    const wb = utils.book_new();

    const formatExcelNum = (val: number, isTotal = false) => {
      // Use truncation as in the reference (25,703.69 -> 25,703)
      const scaledVal = Math.trunc((val || 0) / 1000);
      
      return { 
        v: scaledVal, 
        t: 'n', 
        // Use parentheses for negative numbers: (1,234)
        z: `#,##0;(#,##0);0` 
      };
    };

    const combinedData = [
      ['Company Name:', sortedData[0]?.companyName || ''],
      ['FINANCIAL SPREADING ANALYSIS', ''],
      ['', ''],
      ['Interim', ...sortedData.map(d => d.year)],
      ['', ''],
      ['INCOME STATEMENT', ''],
      ['(EGP in thousands)', ...sortedData.map(d => d.year)],
      ['', ''],
      ['REVENUES', ...sortedData.map(d => formatExcelNum(d.incomeStatement.revenues))],
      ['COST OF GOODS SOLD', ...sortedData.map(d => formatExcelNum(-Math.abs(d.incomeStatement.costOfGoodsSold)))],
      ['DEPRECIATION', ...sortedData.map(d => formatExcelNum(-Math.abs(d.incomeStatement.depreciation1)))],
      ['----------------', ...sortedData.map(() => '----------------')],
      ['GROSS PROFIT', ...sortedData.map(d => formatExcelNum(d.incomeStatement.grossProfit, true))],
      ['', ''],
      ['DEPRECIATION', ...sortedData.map(d => formatExcelNum(-Math.abs(d.incomeStatement.depreciation2)))],
      ['SG&A EXPENSE', ...sortedData.map(d => formatExcelNum(-Math.abs(d.incomeStatement.sgaExpense)))],
      ['PROVISIONS', ...sortedData.map(d => formatExcelNum(-Math.abs(d.incomeStatement.provisions1)))],
      ['R & D', ...sortedData.map(d => formatExcelNum(-Math.abs(d.incomeStatement.rd)))],
      ['GOODWILL AMORTIZATION', ...sortedData.map(d => formatExcelNum(-Math.abs(d.incomeStatement.goodwillAmortization)))],
      ['OTHER AMORTIZATION', ...sortedData.map(d => formatExcelNum(-Math.abs(d.incomeStatement.otherAmortization)))],
      ['----------------', ...sortedData.map(() => '----------------')],
      ['NET OPERATING PROFIT', ...sortedData.map(d => formatExcelNum(d.incomeStatement.netOperatingProfit, true))],
      ['', ''],
      ['GROSS INTEREST EXP--EXIST', ...sortedData.map(d => formatExcelNum(-Math.abs(d.incomeStatement.grossInterestExpExist)))],
      ['INTEREST EXP--NEW', ...sortedData.map(d => formatExcelNum(-Math.abs(d.incomeStatement.interestExpNew)))],
      ['CAPITALIZED INTEREST', ...sortedData.map(d => formatExcelNum(-Math.abs(d.incomeStatement.capitalizedInterest)))],
      ['INTEREST INCOME', ...sortedData.map(d => formatExcelNum(d.incomeStatement.interestIncome))],
      ['DIVIDEND INCOME', ...sortedData.map(d => formatExcelNum(d.incomeStatement.dividendIncome))],
      ['PROV. DOUBTFUL REC.', ...sortedData.map(d => formatExcelNum(-Math.abs(d.incomeStatement.provDoubtfulRec)))],
      ['PROVISIONS', ...sortedData.map(d => formatExcelNum(-Math.abs(d.incomeStatement.provisions2)))],
      ['FX G/L', ...sortedData.map(d => formatExcelNum(d.incomeStatement.fxGL))],
      ['SUNDRY INCOME (EXPENSE)', ...sortedData.map(d => formatExcelNum(d.incomeStatement.sundryIncomeExpense1))],
      ['----------------', ...sortedData.map(() => '----------------')],
      ['NET PROFIT BEFORE TAX', ...sortedData.map(d => formatExcelNum(d.incomeStatement.netProfitBeforeTax, true))],
      ['', ''],
      ['TOTAL TAX EXPENSE', ...sortedData.map(d => formatExcelNum(-Math.abs(d.incomeStatement.totalTaxExpense)))],
      ['  CURRENT TAX EXPENSE', ...sortedData.map(d => formatExcelNum(-Math.abs(d.incomeStatement.currentTaxExpense)))],
      ['  DEFERRED TAX EXPENSE', ...sortedData.map(d => formatExcelNum(-Math.abs(d.incomeStatement.deferredTaxExpense)))],
      ['  ITC', ...sortedData.map(d => formatExcelNum(d.incomeStatement.itc))],
      ['----------------', ...sortedData.map(() => '----------------')],
      ['NET PROFIT AFTER TAX', ...sortedData.map(d => formatExcelNum(d.incomeStatement.netProfitAfterTax, true))],
      ['', ''],
      ['MINORITY INTEREST EXPENSE', ...sortedData.map(d => formatExcelNum(-Math.abs(d.incomeStatement.minorityInterestExpense)))],
      ['SALE OF PLANT', ...sortedData.map(d => formatExcelNum(d.incomeStatement.saleOfPlant))],
      ['SUNDRY INCOME (EXPENSE)', ...sortedData.map(d => formatExcelNum(d.incomeStatement.sundryIncomeExpense2))],
      ['----------------', ...sortedData.map(() => '----------------')],
      ['NPAUI', ...sortedData.map(d => formatExcelNum(d.incomeStatement.npaui, true))],
      ['', ''],
      ['PREF SHARE DIVIDENDS', ...sortedData.map(d => formatExcelNum(-Math.abs(d.incomeStatement.prefShareDividends)))],
      ['COMMON STOCK DIVIDENDS', ...sortedData.map(d => formatExcelNum(-Math.abs(d.incomeStatement.commonStockDividends)))],
      ['OTHER ADJUSTMENT', ...sortedData.map(d => formatExcelNum(d.incomeStatement.otherAdjustment))],
      ['----------------', ...sortedData.map(() => '----------------')],
      ['TOTAL CHANGE IN R/E', ...sortedData.map(d => formatExcelNum(d.incomeStatement.totalChange, true))],
      ['', ''],
      ['END OF YEAR STOCK PRICE', ...sortedData.map(() => ({ v: 0, t: 'n', z: '0.00' }))],
      ['COMMON SHARES OUTSTANDING', ...sortedData.map(() => ({ v: 0, t: 'n', z: '0' }))],
      ['', ''],
      ['BALANCE SHEET', ''],
      ['(EGP in thousands)', ...sortedData.map(d => d.year)],
      ['', ''],
      ['ASSETS', ''],
      ['CASH', ...sortedData.map(d => formatExcelNum(d.balanceSheet.cash))],
      ['MARKETABLE SECURITIES', ...sortedData.map(d => formatExcelNum(d.balanceSheet.marketableSecurities))],
      ['MARKETABLE SEC--EXCESS', ...sortedData.map(d => formatExcelNum(d.balanceSheet.marketableSecExcess))],
      ['ACCOUNTS RECEIVABLE', ...sortedData.map(d => formatExcelNum(d.balanceSheet.accountsReceivable))],
      ['  LESS ALLOWANCES', ...sortedData.map(d => formatExcelNum(-Math.abs(d.balanceSheet.lessAllowances)))],
      ['----------------', ...sortedData.map(() => '----------------')],
      ['NET RECEIVABLES', ...sortedData.map(d => formatExcelNum(d.balanceSheet.netReceivables, true))],
      ['', ''],
      ['INVENTORY:', ''],
      ['  RAW MATERIALS', ...sortedData.map(d => formatExcelNum(d.balanceSheet.rawMaterials))],
      ['  WORK IN PROGRESS', ...sortedData.map(d => formatExcelNum(d.balanceSheet.workInProgress))],
      ['  FINISHED GOODS', ...sortedData.map(d => formatExcelNum(d.balanceSheet.finishedGoods))],
      ['  GOODS IN TRANSIT', ...sortedData.map(d => formatExcelNum(d.balanceSheet.goodsInTransit))],
      ['----------------', ...sortedData.map(() => '----------------')],
      ['TOTAL INVENTORY', ...sortedData.map(d => formatExcelNum(d.balanceSheet.totalInventory, true))],
      ['', ''],
      ['ADVANCE PAYMENTS', ...sortedData.map(d => formatExcelNum(d.balanceSheet.advancePayments))],
      ['NON-TRADE REC.', ...sortedData.map(d => formatExcelNum(d.balanceSheet.nonTradeRec))],
      ['OTHER CURRENT ASSETS', ...sortedData.map(d => formatExcelNum(d.balanceSheet.otherCurrentAssets))],
      ['DUE FROM SISTER CO.', ...sortedData.map(d => formatExcelNum(d.balanceSheet.dueFromSisterCo1))],
      ['----------------', ...sortedData.map(() => '----------------')],
      ['TOTAL CURRENT ASSETS', ...sortedData.map(d => formatExcelNum(d.balanceSheet.totalCurrentAssets, true))],
      ['', ''],
      ['PROPERTY, PLANT & EQUIP:', ''],
      ['  LAND', ...sortedData.map(d => formatExcelNum(d.balanceSheet.land))],
      ['  BUILDING & IMPROVEMENT', ...sortedData.map(d => formatExcelNum(d.balanceSheet.buildingImprovement))],
      ['  MACHINERY & EQUIPMENT', ...sortedData.map(d => formatExcelNum(d.balanceSheet.machineryEquipment))],
      ['  CONST. IN PROGRESS', ...sortedData.map(d => formatExcelNum(d.balanceSheet.constInProgress))],
      ['----------------', ...sortedData.map(() => '----------------')],
      ['GROSS PLANT', ...sortedData.map(d => formatExcelNum(d.balanceSheet.grossPlant, true))],
      ['  LESS ACCUMULATED DEP', ...sortedData.map(d => formatExcelNum(-Math.abs(d.balanceSheet.lessAccumulatedDep)))],
      ['----------------', ...sortedData.map(() => '----------------')],
      ['NET PP&E', ...sortedData.map(d => formatExcelNum(d.balanceSheet.netPpe, true))],
      ['', ''],
      ['ACCOUNTS RECEIVABLES LT', ...sortedData.map(d => formatExcelNum(d.balanceSheet.accountsReceivablesLt))],
      ['DUE FROM SISTER CO', ...sortedData.map(d => formatExcelNum(d.balanceSheet.dueFromSisterCo2))],
      ['OTHER TANGIBLE ASSET', ...sortedData.map(d => formatExcelNum(d.balanceSheet.otherTangibleAsset))],
      ['DEFERRED TAX ASSET', ...sortedData.map(d => formatExcelNum(d.balanceSheet.deferredTaxAsset))],
      ['PREPAIDS', ...sortedData.map(d => formatExcelNum(d.balanceSheet.prepaids))],
      ['GOODWILL', ...sortedData.map(d => formatExcelNum(d.balanceSheet.goodwill))],
      ['OTHER INTANGIBLE ASSET', ...sortedData.map(d => formatExcelNum(d.balanceSheet.otherIntangibleAsset))],
      ['  LESS ACCUM AMORTIZATION', ...sortedData.map(d => formatExcelNum(-Math.abs(d.balanceSheet.lessAccumAmortization)))],
      ['----------------', ...sortedData.map(() => '----------------')],
      ['NET INTANGIBLES', ...sortedData.map(d => formatExcelNum(d.balanceSheet.netIntangibles, true))],
      ['', ''],
      ['----------------', ...sortedData.map(() => '----------------')],
      ['TOTAL ASSETS', ...sortedData.map(d => formatExcelNum(d.balanceSheet.totalAssets, true))],
      ['', ''],
      ['LIABILITIES & EQUITY', ''],
      ['SHORT TERM BORROWING--EXISTING', ...sortedData.map(d => formatExcelNum(d.balanceSheet.shortTermBorrowingExisting))],
      ['SHORT TERM BORROWING--NEW', ...sortedData.map(d => formatExcelNum(d.balanceSheet.shortTermBorrowingNew))],
      ['CP SENIOR DEBT--EXISTING', ...sortedData.map(d => formatExcelNum(d.balanceSheet.cpSeniorDebtExisting))],
      ['CP SENIOR DEBT--NEW', ...sortedData.map(d => formatExcelNum(d.balanceSheet.cpSeniorDebtNew))],
      ['CP CAP LEASE', ...sortedData.map(d => formatExcelNum(d.balanceSheet.cpCapLease))],
      ['CP SUB DEBT--EXISTING', ...sortedData.map(d => formatExcelNum(d.balanceSheet.cpSubDebtExisting))],
      ['CP SALES TAX', ...sortedData.map(d => formatExcelNum(d.balanceSheet.cpSalesTax))],
      ['ACCOUNTS PAYABLE', ...sortedData.map(d => formatExcelNum(d.balanceSheet.accountsPayable))],
      ['TAXES PAYABLE---', ...sortedData.map(d => formatExcelNum(d.balanceSheet.taxesPayable))],
      ['ACCRUED EXPENSES--', ...sortedData.map(d => formatExcelNum(d.balanceSheet.accruedExpenses))],
      ['INTEREST PAYABLE', ...sortedData.map(d => formatExcelNum(d.balanceSheet.interestPayable))],
      ['DIVIDENDS PAYABLE--', ...sortedData.map(d => formatExcelNum(d.balanceSheet.dividendsPayable))],
      ['DOWN PAYMENTS', ...sortedData.map(d => formatExcelNum(d.balanceSheet.downPayments))],
      ['DUE TO SISTER CO', ...sortedData.map(d => formatExcelNum(d.balanceSheet.dueToSisterCo3))],
      ['OTHER CURRENT LIABILITY--', ...sortedData.map(d => formatExcelNum(d.balanceSheet.otherCurrentLiability))],
      ['----------------', ...sortedData.map(() => '----------------')],
      ['TOT CURRENT LIABILITIES', ...sortedData.map(d => formatExcelNum(d.balanceSheet.totCurrentLiabilities, true))],
      ['', ''],
      ['LT LEASE OBLIGATION', ...sortedData.map(d => formatExcelNum(d.balanceSheet.ltLeaseObligation))],
      ['LT SENIOR DEBT--EXISTING', ...sortedData.map(d => formatExcelNum(d.balanceSheet.ltSeniorDebtExisting))],
      ['LT SENIOR DEBT--NEW', ...sortedData.map(d => formatExcelNum(d.balanceSheet.ltSeniorDebtNew))],
      ['LT TAXES', ...sortedData.map(d => formatExcelNum(d.balanceSheet.ltTaxes))],
      ['LT SHARHOLDER LOAN', ...sortedData.map(d => formatExcelNum(d.balanceSheet.ltSharholderLoan))],
      ['----------------', ...sortedData.map(() => '----------------')],
      ['TOTAL LONG-TERM DEBT', ...sortedData.map(d => formatExcelNum(d.balanceSheet.totalLongTermDebt, true))],
      ['', ''],
      ['OTHER NON-CURRENT LIAB', ...sortedData.map(d => formatExcelNum(d.balanceSheet.otherNonCurrentLiab))],
      ['----------------', ...sortedData.map(() => '----------------')],
      ['TOTAL LIABILITIES', ...sortedData.map(d => formatExcelNum(d.balanceSheet.totalLiabilities, true))],
      ['', ''],
      ['GREY AREA:', ''],
      ['DEFERRED TAXES', ...sortedData.map(d => formatExcelNum(d.balanceSheet.deferredTaxes))],
      ['MINORITY INTEREST', ...sortedData.map(d => formatExcelNum(d.balanceSheet.minorityInterest))],
      ['PROVISIONS', ...sortedData.map(d => formatExcelNum(d.balanceSheet.provisions3))],
      ['----------------', ...sortedData.map(() => '----------------')],
      ['TOTAL GREY AREA', ...sortedData.map(d => formatExcelNum(d.balanceSheet.totalGreyArea, true))],
      ['', ''],
      ['PREFERRED STOCK', ...sortedData.map(d => formatExcelNum(d.balanceSheet.preferredStock))],
      ['COMMON STOCK', ...sortedData.map(d => formatExcelNum(d.balanceSheet.commonStock))],
      ['ADDITIONAL PAID-IN CAPITAL', ...sortedData.map(d => formatExcelNum(d.balanceSheet.additionalPaidInCapital))],
      ['RETAINED EARNINGS OPENING', ...sortedData.map(d => formatExcelNum(d.balanceSheet.retainedEarningsOpening))],
      ['  PLUS: NET INCOME', ...sortedData.map(d => formatExcelNum(d.balanceSheet.plusNetIncome))],
      ['  LESS: DIVIDENDS', ...sortedData.map(d => formatExcelNum(-Math.abs(d.balanceSheet.lessDividends)))],
      ['  OTHER ADJUSTMENTS', ...sortedData.map(d => formatExcelNum(d.balanceSheet.otherAdjustments))],
      ['----------------', ...sortedData.map(() => '----------------')],
      ['RETAINED EARNINGS CLOSING', ...sortedData.map(d => formatExcelNum(d.balanceSheet.retainedEarningsClosing, true))],
      ['', ''],
      ['OWNERS ACCOUNT', ...sortedData.map(d => formatExcelNum(d.balanceSheet.ownersAccount))],
      ['FX ADJUSTMENT', ...sortedData.map(d => formatExcelNum(d.balanceSheet.fxAdjustment))],
      ['LEGAL RESERVE', ...sortedData.map(d => formatExcelNum(d.balanceSheet.legalReserve))],
      ['----------------', ...sortedData.map(() => '----------------')],
      ['TOTAL EQUITY', ...sortedData.map(d => formatExcelNum(d.balanceSheet.totalEquity, true))],
      ['----------------', ...sortedData.map(() => '----------------')],
      ['TOTAL LIABS & EQUITY', ...sortedData.map(d => formatExcelNum(d.balanceSheet.totalLiabsAndEquity, true))],
    ];


    const ws = utils.aoa_to_sheet(combinedData);
    ws['!cols'] = [{ wch: 35 }, ...sortedData.map(() => ({ wch: 15 }))];
    utils.book_append_sheet(wb, ws, 'Financial Spreading');

    const company = (sortedData[0]?.companyName || 'Financial_Spreading')
      .replace(/[^a-zA-Z0-9\u0600-\u06FF_-]/g, '_').trim() || 'Financial_Spreading';
    writeFile(wb, `${company}_Spreading_Model.xlsx`);
  };

  const downloadPowerBI = async () => {
    if (sortedData.length === 0) return;
    setIsExportingPbix(true);
    try {
      const summary = computeFinancialModel(sortedData);
      const company = summary.companyName || sortedData[0]?.companyName || 'Credita_Client';
      const cleanCompany = company.replace(/[^a-zA-Z0-9\u0600-\u06FF_-]/g, '_').trim() || 'Company';
      const fileName = `${cleanCompany}_Financial_Dashboard.pbix`;

      // 1. Request customized .pbix containing company's real balance sheet & financial spreading data
      const response = await fetch('/api/generate-pbix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary, companyName: cleanCompany })
      });

      if (!response.ok) {
        throw new Error('Server returned ' + response.status);
      }

      const blob = await response.blob();
      if (blob.size < 10000) {
        throw new Error('Downloaded file too small');
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 3000);

      // Open convenient confirmation dialog
      setPbixSuccessModal({ open: true, companyName: company, fileName });
    } catch (err) {
      console.warn('POST generate-pbix failed, falling back to direct stream:', err);
      const company = sortedData[0]?.companyName || 'Financial';
      const cleanCompany = company.replace(/[^a-zA-Z0-9\u0600-\u06FF_-]/g, '_').trim() || 'Company';
      const fallbackName = `${cleanCompany}_Financial_Dashboard.pbix`;
      const fallbackLink = document.createElement('a');
      fallbackLink.href = `/api/download-official-pbix?company=${encodeURIComponent(company)}&t=${Date.now()}`;
      fallbackLink.download = fallbackName;
      document.body.appendChild(fallbackLink);
      fallbackLink.click();
      setTimeout(() => document.body.removeChild(fallbackLink), 1000);
    } finally {
      setIsExportingPbix(false);
    }
  };

  const downloadCompanionExcel = () => {
    if (sortedData.length === 0) return;
    const summary = computeFinancialModel(sortedData);
    const company = summary.companyName || sortedData[0]?.companyName || 'Credita_Client';
    const cleanCompany = company.replace(/[^a-zA-Z0-9\u0600-\u06FF_-]/g, '_').trim() || 'Company';
    const blob = generatePowerBiExcelWorkbook(summary);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cleanCompany}_Financial_Data.xlsx`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 2000);
  };

  const handleDownloadOnePagePDF = async () => {
    setIsExportingPdf(true);
    setShowWebDashboard(true);
    setDashboardCompact(true);
    
    // Give react time to mount and render the dashboard in compact mode
    await new Promise(resolve => setTimeout(resolve, 350));
    
    try {
      const company = sortedData[0]?.companyName || 'Financial_Spreading';
      await exportDashboardToPdf('executive-1page-dashboard', company, sortedData);
    } catch (err) {
      console.warn('PDF export error:', err);
    } finally {
      setTimeout(() => {
        setIsExportingPdf(false);
      }, 1000);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPassword) return;
    setIsProcessing(true);
    try {
      await updatePassword(user, newPassword);
      alert("Password updated successfully!");
      setIsUpdatePasswordOpen(false);
      setNewPassword('');
    } catch (err: any) {
      console.error("Update password error:", err);
      if (err.code === 'auth/requires-recent-login') {
        alert("For security, please log out and log back in before changing your password.");
      } else {
        alert(err.message || "Failed to update password");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    const confirm = window.confirm("Are you absolutely sure? This will permanently delete your account and all your data. This action cannot be undone.");
    if (!confirm) return;

    setIsProcessing(true);
    try {
      await deleteUser(user);
      alert("Account deleted successfully.");
    } catch (err: any) {
      console.error("Delete account error:", err);
      if (err.code === 'auth/requires-recent-login') {
        alert("For security, please log out and log back in before deleting your account.");
      } else {
        alert(err.message || "Failed to delete account");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {!user || needsVerification ? (
        <AuthScreen 
          key="auth"
          onLogin={handleLogin} 
          user={user} 
          needsVerification={needsVerification} 
        />
      ) : (
        <motion.div 
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen bg-[#f8fafc] dark:bg-deep-navy text-slate-900 dark:text-slate-100 font-lexend selection:bg-credita/10 transition-colors duration-300"
        >
          {/* Header */}
          <header className="bg-white/80 dark:bg-deep-navy/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 transition-colors duration-300 print:hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
              <div className="flex items-center gap-6">
                {/* Logo Image (CR) */}
                <motion.img 
                  layoutId="main-logo"
                  src="https://lh3.googleusercontent.com/d/1FBVVk7kdMfnLmuZVohiOR24qC0jZ7aUC" 
                  alt="CR Logo" 
                  className="h-20 w-auto object-contain cursor-pointer dark:invert dark:brightness-200"
                  referrerPolicy="no-referrer"
                  transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  onClick={resetApp}
                />
              </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <div className="hidden sm:flex items-center gap-8 mr-8">
              <div 
                onClick={() => setStep('upload')}
                className={`flex items-center gap-2 cursor-pointer ${step === 'upload' ? 'text-credita font-semibold' : 'text-slate-400'}`}
              >
                <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs">1</span>
                <span>Upload</span>
              </div>
              <div 
                onClick={() => uploadedFiles.length > 0 && setStep('review')}
                className={`flex items-center gap-2 cursor-pointer ${step === 'review' ? 'text-credita font-semibold' : 'text-slate-400'}`}
              >
                <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs">2</span>
                <span>Review</span>
              </div>
              <div 
                onClick={() => sortedData.length > 0 && setStep('output')}
                className={`flex items-center gap-2 cursor-pointer ${step === 'output' ? 'text-credita font-semibold' : 'text-slate-400'}`}
              >
                <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs">3</span>
                <span>Output</span>
              </div>
            </div>

            {isAuthLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setStep('history')}
                  className={`p-2 rounded-lg transition-colors ${step === 'history' ? 'bg-credita/10 text-credita' : 'text-slate-500 hover:bg-slate-100'}`}
                  title="History"
                >
                  <History className="w-5 h-5" />
                </button>
                {isAdmin && (
                  <button 
                    onClick={() => setStep('messages')}
                    className={`p-2 rounded-lg transition-colors ${step === 'messages' ? 'bg-credita/10 text-credita' : 'text-slate-500 hover:bg-slate-100'}`}
                    title="Support Messages"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>
                )}
                
                <div className="relative">
                  <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center hover:border-credita transition-all overflow-hidden"
                  >
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <UserIcon className="w-5 h-5 text-slate-400" />
                    )}
                  </button>

                  {isProfileOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)}></div>
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-100 z-20 py-2 overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-50">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-bold text-slate-900 truncate">{user.displayName || 'User'}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          isAdmin ? 'bg-indigo-600 text-white shadow-sm' : 
                          (isCompanyUser ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600')
                        }`}>
                          {userPlan}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                        
                        <div className="py-1">
                          <button 
                            onClick={() => {
                              setIsProfileOpen(false);
                              setIsUpdatePasswordOpen(true);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-3"
                          >
                            <Key className="w-4 h-4" />
                            Update Password
                          </button>
                          
                          <button 
                            onClick={() => {
                              setIsProfileOpen(false);
                              handleDeleteAccount();
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete Account
                          </button>
                        </div>
                        
                        <div className="pt-1 border-t border-slate-50">
                          <button 
                            onClick={handleLogout}
                            className="w-full px-4 py-3 text-left text-sm font-bold text-slate-900 hover:bg-slate-50 flex items-center gap-3"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                className="flex items-center gap-2 bg-credita text-white px-4 py-2 rounded-xl font-semibold hover:opacity-90 transition-all shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Update Password Modal */}
      {isUpdatePasswordOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8"
          >
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Update Password</h3>
            <p className="text-slate-500 text-sm mb-6">Enter your new password below.</p>
            
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">New Password</label>
                <input 
                  type="password" 
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-credita/20 focus:border-credita outline-none"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsUpdatePasswordOpen(false)}
                  className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 px-6 py-3 rounded-xl font-bold text-white bg-credita hover:opacity-90 transition-all shadow-lg flex items-center justify-center"
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <AnimatePresence mode="wait">
          {step === 'upload' && (
            <motion.div 
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">Financial Spreading Tool</h1>
                <p className="text-slate-500 dark:text-slate-400 text-lg mb-6">Upload up to 3 financial statements for automated extraction and analysis.</p>
                
                {/* Plan Status Indicator */}
                <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-2xl border ${
                  isCompanyUser ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}>
                  <div className={`w-2 h-2 rounded-full animate-pulse ${isCompanyUser ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                  <span className="text-sm font-bold">
                    {isCompanyUser ? 'Welcome back! You have unlimited Pro access' : 'You are currently using the Free Trial (10 daily uploads)'}
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 transition-colors duration-300">
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-8">
                  <button 
                    onClick={() => setUploadType('pdf')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${uploadType === 'pdf' ? 'bg-white dark:bg-slate-700 shadow-sm text-credita dark:text-neon-blue' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="w-4 h-4" />
                      Upload PDFs
                    </div>
                  </button>
                  <button 
                    onClick={() => setUploadType('image')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${uploadType === 'image' ? 'bg-white dark:bg-slate-700 shadow-sm text-credita dark:text-neon-blue' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      Upload Images
                    </div>
                  </button>
                </div>

                <div 
                  className={`relative rounded-xl transition-all cursor-pointer ${
                    uploadedFiles.length >= 3 
                      ? 'opacity-60 cursor-not-allowed' 
                      : isDragging 
                        ? 'border-2 border-dashed border-credita dark:border-neon-blue bg-credita/10 dark:bg-neon-blue/10 scale-[1.01]' 
                        : 'hover:border-credita/50 dark:hover:border-neon-blue/50'
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (uploadedFiles.length < 3) setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(false);
                    if (uploadedFiles.length >= 3) return;
                    const files = Array.from(e.dataTransfer.files || []);
                    addFiles(files);
                  }}
                  onClick={() => {
                    if (uploadedFiles.length < 3 && fileInputRef.current) {
                      fileInputRef.current.click();
                    }
                  }}
                >
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    multiple 
                    accept={uploadType === 'pdf' ? '.pdf,application/pdf' : 'image/*'}
                    onChange={handleFileChange}
                    className="sr-only"
                    disabled={uploadedFiles.length >= 3}
                  />
                  <div className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                    uploadedFiles.length >= 3 
                      ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700' 
                      : isDragging
                        ? 'border-credita dark:border-neon-blue bg-credita/5 dark:bg-neon-blue/5'
                        : 'border-slate-200 dark:border-slate-700 hover:border-credita/40 dark:hover:border-neon-blue/40 hover:bg-credita/5 dark:hover:bg-neon-blue/5'
                  }`}>
                    <div className="w-16 h-16 bg-credita/10 dark:bg-neon-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileUp className="text-credita dark:text-neon-blue w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                      {uploadedFiles.length >= 3 ? 'Maximum files reached (3/3)' : `Click or drag ${uploadType.toUpperCase()}s here`}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                      Support for Arabic and English financial statements
                    </p>
                    {uploadedFiles.length < 3 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-all"
                      >
                        <FileUp className="w-4 h-4 text-credita dark:text-neon-blue" />
                        <span>Browse {uploadType.toUpperCase()} Files</span>
                      </button>
                    )}
                  </div>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="mt-8 space-y-3">
                    {uploadedFiles.map((f) => (
                      <div key={f.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white dark:bg-slate-700 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-600">
                            {uploadType === 'pdf' ? <FileText className="text-red-500 w-5 h-5" /> : <ImageIcon className="text-credita dark:text-neon-blue w-5 h-5" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-[200px]">{f.file.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{(f.file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => removeFile(f.id)}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button 
                  disabled={uploadedFiles.length === 0 || isProcessing}
                  onClick={startExtraction}
                  className="w-full mt-8 bg-credita dark:bg-neon-blue hover:opacity-90 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-slate-200 dark:shadow-none transition-all flex flex-col items-center justify-center gap-1"
                >
                  {isProcessing ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span>{loadingMessage}</span>
                      </div>
                      <span className="text-xs font-normal opacity-80 italic">
                        Processing takes 15-25 seconds...
                      </span>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      Extract Data Automatically
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {step === 'review' && (
            <motion.div 
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">Extraction Review</h2>
                  <p className="text-slate-500">Verify the key metrics extracted from each document.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button 
                    onClick={() => setStep('upload')}
                    className="px-6 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm"
                  >
                    Re-upload
                  </button>
                  {sortedData.length > 0 && (
                    <button 
                      onClick={downloadExcel}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md transition-all flex items-center gap-2 text-sm active:scale-95 border border-emerald-500 cursor-pointer"
                      title="تنزيل شيت الإكسيل مباشرة"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
                      <span>Download Excel</span>
                    </button>
                  )}
                  <button 
                    disabled={isProcessing || uploadedFiles.some(f => f.status === 'error')}
                    onClick={() => setStep('output')}
                    className="px-6 py-2 bg-credita disabled:bg-slate-300 text-white rounded-xl font-semibold hover:opacity-90 shadow-lg shadow-slate-100 transition-all flex items-center gap-2 text-sm"
                  >
                    Generate Output
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {isProcessing && (
                <div className="bg-credita/5 dark:bg-credita/10 border border-credita/10 p-4 rounded-2xl flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-credita/10 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-credita animate-spin" />
                  </div>
                  <div>
                    <p className="text-credita font-bold text-sm">{loadingMessage}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">Processing in progress. This usually takes 30-45 seconds.</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {uploadedFiles.map((f, index) => (
                  <motion.div 
                    key={f.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                  >
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50 group-hover:bg-credita/5 transition-colors">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className={`w-5 h-5 ${f.status === 'success' ? 'text-green-500' : 'text-slate-300 dark:text-slate-700'}`} />
                        <span className="font-bold text-slate-800 dark:text-slate-200">FY {f.year || 'Detecting...'}</span>
                      </div>
                      {f.status === 'error' && (
                        <div className="flex items-center gap-1 text-red-500 text-xs font-medium">
                          <AlertCircle className="w-3 h-3" />
                          Error
                        </div>
                      )}
                    </div>
                    <div className="p-6 space-y-4">
                      {f.status === 'extracting' ? (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <Skeleton className="w-20 h-4" />
                            <Skeleton className="w-24 h-4" />
                          </div>
                          <div className="flex justify-between items-center">
                            <Skeleton className="w-16 h-4" />
                            <Skeleton className="w-28 h-4" />
                          </div>
                          <div className="pt-2 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center">
                            <Skeleton className="w-24 h-5" />
                            <Skeleton className="w-20 h-5" />
                          </div>
                          <div className="flex justify-between items-center">
                            <Skeleton className="w-28 h-4" />
                            <Skeleton className="w-24 h-4" />
                          </div>
                        </div>
                      ) : f.status === 'error' ? (
                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-900/30 space-y-3">
                          <p className="text-red-600 dark:text-red-400 text-xs font-medium leading-relaxed">
                            {f.error || 'An unexpected error occurred during extraction.'}
                          </p>
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => reExtract(f.id)}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                            >
                              <RefreshCcw className="w-3.5 h-3.5" />
                              إعادة المحاولة / Retry
                            </button>
                            <button
                              onClick={() => removeFile(f.id)}
                              className="px-3 py-1.5 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-950/50 rounded-lg text-xs font-medium transition-all flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              حذف / Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500 dark:text-slate-400 text-sm">Revenue</span>
                            <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{f.data ? formatCurrency(f.data.incomeStatement.revenues) : '—'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500 dark:text-slate-400 text-sm">COGS</span>
                            <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{f.data ? formatCurrency(f.data.incomeStatement.costOfGoodsSold) : '—'}</span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-slate-50 dark:border-slate-800">
                            <span className="text-slate-500 dark:text-slate-400 text-sm font-bold">Net Profit</span>
                            <span className="font-mono font-bold text-green-600 dark:text-green-400">{f.data ? formatCurrency(f.data.incomeStatement.netProfitAfterTax) : '—'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500 dark:text-slate-400 text-sm">Total Assets</span>
                            <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{f.data ? formatCurrency(f.data.balanceSheet.totalAssets) : '—'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500 dark:text-slate-400 text-sm">Total Equity</span>
                            <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{f.data ? formatCurrency(f.data.balanceSheet.totalEquity) : '—'}</span>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                      <button 
                        onClick={() => reExtract(f.id)}
                        disabled={f.status === 'extracting'}
                        className="w-full flex items-center justify-center gap-2 text-xs font-bold text-credita hover:opacity-80 transition-colors py-2"
                      >
                        {f.status === 'extracting' ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <RefreshCcw className="w-3 h-3" />
                        )}
                        RE-EXTRACT WITH HIGHER PRECISION
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'output' && (
            <motion.div 
              key="output"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between print:hidden">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Spreading Output</h2>
                  <p className="text-slate-500 dark:text-slate-400">Final financial spreading report. You can edit values directly in the table.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button 
                    onClick={() => setStep('review')}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm"
                  >
                    Back to Review
                  </button>
                  <button 
                    id="btn-download-excel-spread"
                    onClick={downloadExcel}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-sm active:scale-95 border border-emerald-500 cursor-pointer"
                    title="تنزيل شيت الإكسيل الأصلي للتحليل المالي والقوائم المالية (Excel Spreading Model)"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
                    <span>Download Excel Sheet</span>
                  </button>
                  <button 
                    id="btn-download-one-page-pdf"
                    onClick={handleDownloadOnePagePDF}
                    disabled={isExportingPdf}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-950 rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-sm active:scale-95 border border-slate-700 dark:border-slate-300 disabled:opacity-75 cursor-pointer"
                    title="تنزيل تقرير الداشبورد المالي كملف PDF في صفحة واحدة A4 Fit"
                  >
                    {isExportingPdf ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                        <span>Generating PDF...</span>
                      </>
                    ) : (
                      <>
                        <Printer className="w-4 h-4 text-amber-400 dark:text-amber-500" />
                        <span>Download 1-Page PDF</span>
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => setShowWebDashboard(prev => !prev)}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all flex items-center gap-2 text-sm shadow-sm"
                    title="عرض لوحة المؤشرات المالية والتحليل التنفيذي مباشرة"
                  >
                    <BarChart3 className="w-4 h-4 text-white" />
                    {showWebDashboard ? 'Hide Dashboard' : '📊 Executive Dashboard'}
                  </button>
                  <button 
                    onClick={saveToHistory}
                    disabled={isSaving}
                    className="px-5 py-2 bg-credita dark:bg-neon-blue text-white rounded-xl font-semibold hover:opacity-90 shadow-sm transition-all flex items-center gap-2 text-sm"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save to History
                  </button>
                </div>
              </div>

              {/* Embedded Interactive BI Dashboard when toggled */}
              {showWebDashboard && (
                <div className="mb-10 bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 rounded-2xl border-2 border-indigo-400/40 shadow-xl">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-800 print:hidden">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse"></div>
                      <span className="font-bold text-slate-900 dark:text-white text-base">
                        Executive Financial Dashboard ({sortedData[0]?.companyName || 'Corporate Client'})
                      </span>
                    </div>
                    <button 
                      onClick={() => setShowWebDashboard(false)}
                      className="text-xs px-3 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium"
                    >
                      Close View ✕
                    </button>
                  </div>
                  <PowerBIDashboard 
                    data={sortedData} 
                    onBack={() => setShowWebDashboard(false)} 
                    isDark={darkMode}
                    initialCompactMode={dashboardCompact}
                    onDataChange={handleDashboardDataChange}
                  />
                </div>
              )}

              <div className={`space-y-12 ${showWebDashboard ? 'print:hidden' : ''}`}>
                {/* Income Statement */}
                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-credita/10 dark:bg-neon-blue/10 rounded-xl flex items-center justify-center">
                      <FileText className="text-credita dark:text-neon-blue w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Income Statement (LE 000's)</h3>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-sm transition-colors duration-300">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                          <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Line Item</th>
                          {sortedData.map(d => (
                            <th key={d.year} className="py-4 px-6 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-right">FY {d.year}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        <TableRow 
                          label="REVENUES" 
                          values={sortedData.map(d => d.incomeStatement.revenues)} 
                          format={formatCurrency} 
                          isBold 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'incomeStatement', 'revenues', val)}
                        />
                        <TableRow 
                          label="COST OF GOODS SOLD" 
                          values={sortedData.map(d => d.incomeStatement.costOfGoodsSold)} 
                          format={formatCurrency} 
                          isNegative 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'incomeStatement', 'costOfGoodsSold', val)}
                        />
                        <TableRow 
                          label="DEPRECIATION" 
                          values={sortedData.map(d => d.incomeStatement.depreciation1)} 
                          format={formatCurrency} 
                          isNegative 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'incomeStatement', 'depreciation1', val)}
                        />
                        <TableRow label="GROSS PROFIT" values={sortedData.map(d => d.incomeStatement.grossProfit)} format={formatCurrency} isBold isHighlight />
                        <TableRow 
                          label="DEPRECIATION" 
                          values={sortedData.map(d => d.incomeStatement.depreciation2)} 
                          format={formatCurrency} 
                          isNegative 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'incomeStatement', 'depreciation2', val)}
                        />
                        <TableRow 
                          label="SG&A EXPENSE" 
                          values={sortedData.map(d => d.incomeStatement.sgaExpense)} 
                          format={formatCurrency} 
                          isNegative 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'incomeStatement', 'sgaExpense', val)}
                        />
                        <TableRow 
                          label="PROVISIONS" 
                          values={sortedData.map(d => d.incomeStatement.provisions1)} 
                          format={formatCurrency} 
                          isNegative 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'incomeStatement', 'provisions1', val)}
                        />
                        <TableRow 
                          label="R & D" 
                          values={sortedData.map(d => d.incomeStatement.rd)} 
                          format={formatCurrency} 
                          isNegative 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'incomeStatement', 'rd', val)}
                        />
                        <TableRow 
                          label="GOODWILL AMORTIZATION" 
                          values={sortedData.map(d => d.incomeStatement.goodwillAmortization)} 
                          format={formatCurrency} 
                          isNegative 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'incomeStatement', 'goodwillAmortization', val)}
                        />
                        <TableRow 
                          label="OTHER AMORTIZATION" 
                          values={sortedData.map(d => d.incomeStatement.otherAmortization)} 
                          format={formatCurrency} 
                          isNegative 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'incomeStatement', 'otherAmortization', val)}
                        />
                        <TableRow label="NET OPERATING PROFIT" values={sortedData.map(d => d.incomeStatement.netOperatingProfit)} format={formatCurrency} isBold isHighlight />
                        <TableRow 
                          label="GROSS INTEREST EXP--EXIST" 
                          values={sortedData.map(d => d.incomeStatement.grossInterestExpExist)} 
                          format={formatCurrency} 
                          isNegative 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'incomeStatement', 'grossInterestExpExist', val)}
                        />
                        <TableRow 
                          label="INTEREST EXP--NEW" 
                          values={sortedData.map(d => d.incomeStatement.interestExpNew)} 
                          format={formatCurrency} 
                          isNegative 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'incomeStatement', 'interestExpNew', val)}
                        />
                        <TableRow 
                          label="CAPITALIZED INTEREST" 
                          values={sortedData.map(d => d.incomeStatement.capitalizedInterest)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'incomeStatement', 'capitalizedInterest', val)}
                        />
                        <TableRow 
                          label="INTEREST INCOME" 
                          values={sortedData.map(d => d.incomeStatement.interestIncome)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'incomeStatement', 'interestIncome', val)}
                        />
                        <TableRow 
                          label="DIVIDEND INCOME" 
                          values={sortedData.map(d => d.incomeStatement.dividendIncome)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'incomeStatement', 'dividendIncome', val)}
                        />
                        <TableRow 
                          label="PROV. DOUBTFUL REC." 
                          values={sortedData.map(d => d.incomeStatement.provDoubtfulRec)} 
                          format={formatCurrency} 
                          isNegative 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'incomeStatement', 'provDoubtfulRec', val)}
                        />
                        <TableRow 
                          label="PROVISIONS" 
                          values={sortedData.map(d => d.incomeStatement.provisions2)} 
                          format={formatCurrency} 
                          isNegative 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'incomeStatement', 'provisions2', val)}
                        />
                        <TableRow 
                          label="FX G/L" 
                          values={sortedData.map(d => d.incomeStatement.fxGL)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'incomeStatement', 'fxGL', val)}
                        />
                        <TableRow 
                          label="SUNDRY INCOME (EXPENSE)" 
                          values={sortedData.map(d => d.incomeStatement.sundryIncomeExpense1)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'incomeStatement', 'sundryIncomeExpense1', val)}
                        />
                        <TableRow label="NET PROFIT BEFORE TAX" values={sortedData.map(d => d.incomeStatement.netProfitBeforeTax)} format={formatCurrency} isBold isHighlight notes={sortedData.map(d => d.notes?.netProfitBeforeTax || '')} />
                        <TableRow 
                          label="TOTAL TAX EXPENSE" 
                          values={sortedData.map(d => d.incomeStatement.totalTaxExpense)} 
                          format={formatCurrency} 
                          isNegative 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'incomeStatement', 'totalTaxExpense', val)}
                        />
                        <TableRow 
                          label="CURRENT TAX EXPENSE" 
                          values={sortedData.map(d => d.incomeStatement.currentTaxExpense)} 
                          format={formatCurrency} 
                          isNegative 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'incomeStatement', 'currentTaxExpense', val)}
                        />
                        <TableRow 
                          label="DEFERRED TAX EXPENSE" 
                          values={sortedData.map(d => d.incomeStatement.deferredTaxExpense)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'incomeStatement', 'deferredTaxExpense', val)}
                        />
                        <TableRow 
                          label="ITC" 
                          values={sortedData.map(d => d.incomeStatement.itc)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'incomeStatement', 'itc', val)}
                        />
                        <TableRow label="NET PROFIT AFTER TAX" values={sortedData.map(d => d.incomeStatement.netProfitAfterTax)} format={formatCurrency} isBold isHighlight />
                        <TableRow label="MINORITY INTEREST EXPENSE" values={sortedData.map(d => d.incomeStatement.minorityInterestExpense)} format={formatCurrency} isNegative />
                        <TableRow label="SALE OF PLANT" values={sortedData.map(d => d.incomeStatement.saleOfPlant)} format={formatCurrency} />
                        <TableRow label="SUNDRY INCOME (EXPENSE)" values={sortedData.map(d => d.incomeStatement.sundryIncomeExpense2)} format={formatCurrency} />
                        <TableRow label="NPAUI" values={sortedData.map(d => d.incomeStatement.npaui)} format={formatCurrency} isBold />
                        <TableRow label="PREF SHARE DIVIDENDS" values={sortedData.map(d => d.incomeStatement.prefShareDividends)} format={formatCurrency} isNegative />
                        <TableRow label="COMMON STOCK DIVIDENDS" values={sortedData.map(d => d.incomeStatement.commonStockDividends)} format={formatCurrency} isNegative />
                        <TableRow 
                          label="OTHER ADJUSTMENT" 
                          values={sortedData.map(d => d.incomeStatement.otherAdjustment)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'incomeStatement', 'otherAdjustment', val)}
                        />
                        <TableRow label="TOTAL CHANGE IN R/E" values={sortedData.map(d => d.incomeStatement.totalChange)} format={formatCurrency} isBold isHighlight />
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Balance Sheet */}
                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                      <TableIcon className="text-green-600 dark:text-green-400 w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Balance Sheet (LE 000's)</h3>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-sm transition-colors duration-300">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                          <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Line Item</th>
                          {sortedData.map(d => (
                            <th key={d.year} className="py-4 px-6 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-right">FY {d.year}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                          <td colSpan={sortedData.length + 1} className="px-6 py-2 text-[10px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">ASSETS</td>
                        </tr>
                        <TableRow 
                          label="CASH" 
                          values={sortedData.map(d => d.balanceSheet.cash)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'cash', val)}
                        />
                        <TableRow 
                          label="MARKETABLE SECURITIES" 
                          values={sortedData.map(d => d.balanceSheet.marketableSecurities)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'marketableSecurities', val)}
                          notes={sortedData.map(d => d.notes?.marketableSecurities || '')}
                        />
                        <TableRow 
                          label="MARKETABLE SEC--EXCESS" 
                          values={sortedData.map(d => d.balanceSheet.marketableSecExcess)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'marketableSecExcess', val)}
                        />
                        <TableRow 
                          label="ACCOUNTS RECEIVABLE" 
                          values={sortedData.map(d => d.balanceSheet.accountsReceivable)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'accountsReceivable', val)}
                        />
                        <TableRow 
                          label="LESS ALLOWANCES" 
                          values={sortedData.map(d => d.balanceSheet.lessAllowances)} 
                          format={formatCurrency} 
                          isNegative 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'lessAllowances', val)}
                        />
                        <TableRow label="NET RECEIVABLES" values={sortedData.map(d => d.balanceSheet.netReceivables)} format={formatCurrency} isBold isHighlight />
                        
                        <TableRow 
                          label="RAW MATERIALS" 
                          values={sortedData.map(d => d.balanceSheet.rawMaterials)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'rawMaterials', val)}
                        />
                        <TableRow 
                          label="WORK IN PROGRESS" 
                          values={sortedData.map(d => d.balanceSheet.workInProgress)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'workInProgress', val)}
                        />
                        <TableRow 
                          label="FINISHED GOODS" 
                          values={sortedData.map(d => d.balanceSheet.finishedGoods)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'finishedGoods', val)}
                        />
                        <TableRow 
                          label="GOODS IN TRANSIT" 
                          values={sortedData.map(d => d.balanceSheet.goodsInTransit)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'goodsInTransit', val)}
                        />
                        <TableRow label="TOTAL INVENTORY" values={sortedData.map(d => d.balanceSheet.totalInventory)} format={formatCurrency} isBold isHighlight />
                        
                        <TableRow 
                          label="ADVANCE PAYMENTS" 
                          values={sortedData.map(d => d.balanceSheet.advancePayments)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'advancePayments', val)}
                        />
                        <TableRow 
                          label="NON-TRADE REC." 
                          values={sortedData.map(d => d.balanceSheet.nonTradeRec)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'nonTradeRec', val)}
                        />
                        <TableRow 
                          label="OTHER CURRENT ASSETS" 
                          values={sortedData.map(d => d.balanceSheet.otherCurrentAssets)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'otherCurrentAssets', val)}
                        />
                        <TableRow 
                          label="DUE FROM SISTER CO." 
                          values={sortedData.map(d => d.balanceSheet.dueFromSisterCo1)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'dueFromSisterCo1', val)}
                        />
                        <TableRow label="TOTAL CURRENT ASSETS" values={sortedData.map(d => d.balanceSheet.totalCurrentAssets)} format={formatCurrency} isBold isHighlight />
                        
                        <TableRow 
                          label="LAND" 
                          values={sortedData.map(d => d.balanceSheet.land)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'land', val)}
                        />
                        <TableRow 
                          label="BUILDING & IMPROVEMENT" 
                          values={sortedData.map(d => d.balanceSheet.buildingImprovement)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'buildingImprovement', val)}
                        />
                        <TableRow 
                          label="MACHINERY & EQUIPMENT" 
                          values={sortedData.map(d => d.balanceSheet.machineryEquipment)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'machineryEquipment', val)}
                        />
                        <TableRow 
                          label="CONST. IN PROGRESS" 
                          values={sortedData.map(d => d.balanceSheet.constInProgress)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'constInProgress', val)}
                        />
                        <TableRow label="GROSS PLANT" values={sortedData.map(d => d.balanceSheet.grossPlant)} format={formatCurrency} isBold isHighlight />
                        <TableRow 
                          label="LESS ACCUMULATED DEP" 
                          values={sortedData.map(d => d.balanceSheet.lessAccumulatedDep)} 
                          format={formatCurrency} 
                          isNegative 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'lessAccumulatedDep', val)}
                        />
                        <TableRow label="NET PP&E" values={sortedData.map(d => d.balanceSheet.netPpe)} format={formatCurrency} isBold isHighlight />
                        
                        <TableRow 
                          label="ACCOUNTS RECEIVABLES LT" 
                          values={sortedData.map(d => d.balanceSheet.accountsReceivablesLt)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'accountsReceivablesLt', val)}
                        />
                        <TableRow 
                          label="DUE FROM SISTER CO" 
                          values={sortedData.map(d => d.balanceSheet.dueFromSisterCo2)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'dueFromSisterCo2', val)}
                        />
                        <TableRow 
                          label="OTHER TANGIBLE ASSET" 
                          values={sortedData.map(d => d.balanceSheet.otherTangibleAsset)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'otherTangibleAsset', val)}
                        />
                        <TableRow 
                          label="DEFERRED TAX ASSET" 
                          values={sortedData.map(d => d.balanceSheet.deferredTaxAsset)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'deferredTaxAsset', val)}
                        />
                        <TableRow 
                          label="PREPAIDS" 
                          values={sortedData.map(d => d.balanceSheet.prepaids)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'prepaids', val)}
                        />
                        <TableRow 
                          label="GOODWILL" 
                          values={sortedData.map(d => d.balanceSheet.goodwill)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'goodwill', val)}
                        />
                        <TableRow 
                          label="OTHER INTANGIBLE ASSET" 
                          values={sortedData.map(d => d.balanceSheet.otherIntangibleAsset)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'otherIntangibleAsset', val)}
                        />
                        <TableRow 
                          label="LESS ACCUM AMORTIZATION" 
                          values={sortedData.map(d => d.balanceSheet.lessAccumAmortization)} 
                          format={formatCurrency} 
                          isNegative 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'lessAccumAmortization', val)}
                        />
                        <TableRow label="NET INTANGIBLES" values={sortedData.map(d => d.balanceSheet.netIntangibles)} format={formatCurrency} isBold isHighlight />
                        <TableRow label="TOTAL ASSETS" values={sortedData.map(d => d.balanceSheet.totalAssets)} format={formatCurrency} isBold isHighlight />

                        <tr className="bg-slate-50/50">
                          <td colSpan={sortedData.length + 1} className="px-6 py-2 text-[10px] font-bold text-slate-900 uppercase tracking-wider">LIABILITIES & EQUITY</td>
                        </tr>
                        <TableRow 
                          label="SHORT TERM BORROWING--EXISTING" 
                          values={sortedData.map(d => d.balanceSheet.shortTermBorrowingExisting)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'shortTermBorrowingExisting', val)}
                          notes={sortedData.map(d => d.notes?.shortTermBorrowingExisting || '')}
                        />
                        <TableRow 
                          label="SHORT TERM BORROWING--NEW" 
                          values={sortedData.map(d => d.balanceSheet.shortTermBorrowingNew)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'shortTermBorrowingNew', val)}
                          notes={sortedData.map(d => d.notes?.shortTermBorrowingNew || '')}
                        />
                        <TableRow 
                          label="CP SENIOR DEBT--EXISTING" 
                          values={sortedData.map(d => d.balanceSheet.cpSeniorDebtExisting)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'cpSeniorDebtExisting', val)}
                        />
                        <TableRow 
                          label="CP SENIOR DEBT--NEW" 
                          values={sortedData.map(d => d.balanceSheet.cpSeniorDebtNew)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'cpSeniorDebtNew', val)}
                        />
                        <TableRow 
                          label="CP CAP LEASE" 
                          values={sortedData.map(d => d.balanceSheet.cpCapLease)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'cpCapLease', val)}
                        />
                        <TableRow 
                          label="CP SUB DEBT--EXISTING" 
                          values={sortedData.map(d => d.balanceSheet.cpSubDebtExisting)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'cpSubDebtExisting', val)}
                        />
                        <TableRow 
                          label="CP SALES TAX" 
                          values={sortedData.map(d => d.balanceSheet.cpSalesTax)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'cpSalesTax', val)}
                        />
                        <TableRow 
                          label="ACCOUNTS PAYABLE" 
                          values={sortedData.map(d => d.balanceSheet.accountsPayable)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'accountsPayable', val)}
                        />
                        <TableRow 
                          label="TAXES PAYABLE" 
                          values={sortedData.map(d => d.balanceSheet.taxesPayable)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'taxesPayable', val)}
                        />
                        <TableRow 
                          label="ACCRUED EXPENSES" 
                          values={sortedData.map(d => d.balanceSheet.accruedExpenses)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'accruedExpenses', val)}
                        />
                        <TableRow 
                          label="INTEREST PAYABLE" 
                          values={sortedData.map(d => d.balanceSheet.interestPayable)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'interestPayable', val)}
                        />
                        <TableRow 
                          label="DIVIDENDS PAYABLE" 
                          values={sortedData.map(d => d.balanceSheet.dividendsPayable)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'dividendsPayable', val)}
                        />
                        <TableRow 
                          label="DOWN PAYMENTS" 
                          values={sortedData.map(d => d.balanceSheet.downPayments)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'downPayments', val)}
                        />
                        <TableRow 
                          label="DUE TO SISTER CO" 
                          values={sortedData.map(d => d.balanceSheet.dueToSisterCo3)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'dueToSisterCo3', val)}
                        />
                        <TableRow 
                          label="OTHER CURRENT LIABILITY" 
                          values={sortedData.map(d => d.balanceSheet.otherCurrentLiability)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'otherCurrentLiability', val)}
                        />
                        <TableRow label="TOT CURRENT LIABILITIES" values={sortedData.map(d => d.balanceSheet.totCurrentLiabilities)} format={formatCurrency} isBold isHighlight />
                        <TableRow 
                          label="LT LEASE OBLIGATION" 
                          values={sortedData.map(d => d.balanceSheet.ltLeaseObligation)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'ltLeaseObligation', val)}
                        />
                        <TableRow 
                          label="LT SENIOR DEBT--EXISTING" 
                          values={sortedData.map(d => d.balanceSheet.ltSeniorDebtExisting)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'ltSeniorDebtExisting', val)}
                        />
                        <TableRow 
                          label="LT SENIOR DEBT--NEW" 
                          values={sortedData.map(d => d.balanceSheet.ltSeniorDebtNew)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'ltSeniorDebtNew', val)}
                        />
                        <TableRow 
                          label="LT TAXES" 
                          values={sortedData.map(d => d.balanceSheet.ltTaxes)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'ltTaxes', val)}
                        />
                        <TableRow 
                          label="LT SHARHOLDER LOAN" 
                          values={sortedData.map(d => d.balanceSheet.ltSharholderLoan)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'ltSharholderLoan', val)}
                        />
                        <TableRow label="TOTAL LONG-TERM DEBT" values={sortedData.map(d => d.balanceSheet.totalLongTermDebt)} format={formatCurrency} isBold isHighlight />
                        <TableRow 
                          label="OTHER NON-CURRENT LIAB" 
                          values={sortedData.map(d => d.balanceSheet.otherNonCurrentLiab)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'otherNonCurrentLiab', val)}
                        />
                        <TableRow label="TOTAL LIABILITIES" values={sortedData.map(d => d.balanceSheet.totalLiabilities)} format={formatCurrency} isBold isHighlight />
                        <TableRow 
                          label="DEFERRED TAXES" 
                          values={sortedData.map(d => d.balanceSheet.deferredTaxes)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'deferredTaxes', val)}
                        />
                        <TableRow 
                          label="MINORITY INTEREST" 
                          values={sortedData.map(d => d.balanceSheet.minorityInterest)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'minorityInterest', val)}
                        />
                        <TableRow 
                          label="PROVISIONS" 
                          values={sortedData.map(d => d.balanceSheet.provisions3)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'provisions3', val)}
                        />
                        <TableRow label="TOTAL GREY AREA" values={sortedData.map(d => d.balanceSheet.totalGreyArea)} format={formatCurrency} isBold isHighlight />
                        <TableRow 
                          label="PREFERRED STOCK" 
                          values={sortedData.map(d => d.balanceSheet.preferredStock)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'preferredStock', val)}
                        />
                        <TableRow 
                          label="COMMON STOCK" 
                          values={sortedData.map(d => d.balanceSheet.commonStock)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'commonStock', val)}
                        />
                        <TableRow 
                          label="ADDITIONAL PAID-IN CAPITAL" 
                          values={sortedData.map(d => d.balanceSheet.additionalPaidInCapital)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'additionalPaidInCapital', val)}
                        />
                        <TableRow 
                          label="RETAINED EARNINGS OPENING" 
                          values={sortedData.map(d => d.balanceSheet.retainedEarningsOpening)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'retainedEarningsOpening', val)}
                        />
                        <TableRow label="PLUS: NET INCOME" values={sortedData.map(d => d.balanceSheet.plusNetIncome)} format={formatCurrency} />
                        <TableRow 
                          label="LESS: DIVIDENDS" 
                          values={sortedData.map(d => d.balanceSheet.lessDividends)} 
                          format={formatCurrency} 
                          isNegative 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'lessDividends', val)}
                        />
                        <TableRow 
                          label="OTHER ADJUSTMENTS" 
                          values={sortedData.map(d => d.balanceSheet.otherAdjustments)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'otherAdjustments', val)}
                        />
                        <TableRow label="RETAINED EARNINGS CLOSING" values={sortedData.map(d => d.balanceSheet.retainedEarningsClosing)} format={formatCurrency} isBold isHighlight />
                        <TableRow 
                          label="OWNERS ACCOUNT" 
                          values={sortedData.map(d => d.balanceSheet.ownersAccount)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'ownersAccount', val)}
                        />
                        <TableRow 
                          label="FX ADJUSTMENT" 
                          values={sortedData.map(d => d.balanceSheet.fxAdjustment)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'fxAdjustment', val)}
                        />
                        <TableRow 
                          label="LEGAL RESERVE" 
                          values={sortedData.map(d => d.balanceSheet.legalReserve)} 
                          format={formatCurrency} 
                          isEditable
                          fileIds={sortedFiles.map(f => f.id)}
                          onValueChange={(id, val) => handleValueChange(id, 'balanceSheet', 'legalReserve', val)}
                        />
                        <TableRow label="TOTAL EQUITY" values={sortedData.map(d => d.balanceSheet.totalEquity)} format={formatCurrency} isBold isHighlight />
                        <TableRow label="TOTAL LIABS & EQUITY" values={sortedData.map(d => d.balanceSheet.totalLiabsAndEquity)} format={formatCurrency} isBold isHighlight />
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>

              {/* Floating AI Financial Advisor Copilot */}
              {!showWebDashboard && sortedData.length > 0 && (
                <DashboardAICopilot
                  modelSummary={computeFinancialModel(sortedData)}
                  fullFinancialData={sortedData}
                  isDark={darkMode}
                  onAddCustomChart={() => {
                    setShowWebDashboard(true);
                  }}
                />
              )}
            </motion.div>
          )}
          {step === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Analysis History</h2>
                  <p className="text-slate-500 dark:text-slate-400">View and manage your previously saved financial analyses.</p>
                </div>
                <button 
                  onClick={() => setStep('upload')}
                  className="flex items-center gap-2 text-credita dark:text-neon-blue font-semibold hover:opacity-80 transition-opacity"
                >
                  <Plus className="w-5 h-5" />
                  New Analysis
                </button>
              </div>

              {savedStatements.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center transition-colors duration-300">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <History className="text-slate-300 dark:text-slate-600 w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No history found</h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-6">You haven't saved any analyses yet. Start by uploading some files!</p>
                  <button 
                    onClick={() => setStep('upload')}
                    className="bg-credita dark:bg-neon-blue text-white px-6 py-2 rounded-xl font-semibold hover:opacity-90 transition-all"
                  >
                    Start First Analysis
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {savedStatements.map((stmt) => (
                    <div key={stmt.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all group">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-credita/10 dark:bg-neon-blue/10 rounded-xl flex items-center justify-center">
                          <FileText className="text-credita dark:text-neon-blue w-6 h-6" />
                        </div>
                        <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                          {stmt.createdAt?.toDate ? stmt.createdAt.toDate().toLocaleDateString() : 'Recent'}
                        </span>
                      </div>
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1 tracking-tight">{stmt.companyName}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Fiscal Year: {stmt.fiscalYear}</p>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => {
                            setUploadedFiles(stmt.data.map((d: any) => ({
                              id: Math.random().toString(36).substr(2, 9),
                              file: new File([], 'Historical Data'),
                              year: d.year.toString(),
                              status: 'success',
                              data: d
                            })));
                            setStep('output');
                          }}
                          className="flex-1 bg-slate-900 dark:bg-slate-800 text-white py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-700 transition-all"
                        >
                          View Analysis
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
          {step === 'messages' && isAdmin && (
            <motion.div 
              key="messages"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Support Messages</h2>
                  <p className="text-slate-500 dark:text-slate-400">View and manage incoming support requests.</p>
                </div>
                <button 
                  onClick={() => setStep('upload')}
                  className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-2 transition-colors"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  Back to Upload
                </button>
              </div>

              <div className="space-y-4">
                {supportMessages.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center transition-colors duration-300">
                    <MessageSquare className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                    <p className="text-slate-500 dark:text-slate-400">No support messages yet.</p>
                  </div>
                ) : (
                  supportMessages.map((msg) => (
                    <div key={msg.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white tracking-tight">{msg.name}</h4>
                          <a href={`mailto:${msg.email}`} className="text-sm text-credita dark:text-neon-blue hover:underline">{msg.email}</a>
                        </div>
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {msg.createdAt?.toDate().toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                        {msg.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-deep-navy border-t border-slate-200 dark:border-slate-800 py-12 mt-12 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-4 mb-6">
                <img 
                  src="https://lh3.googleusercontent.com/d/11M23dOt1x49ZRANgrZyhvY0sWL0Y7EQB" 
                  alt="Credita Name" 
                  className="h-20 w-auto object-contain dark:invert dark:brightness-200"
                  referrerPolicy="no-referrer"
                />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md">
                Professional Financial Spreading Engine designed for bank-grade financial statement extraction and analysis. 
                Built for speed, precision, and confidentiality.
              </p>
            </div>
            <div className="text-left md:text-right">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Support</h3>
              <button 
                onClick={() => setIsContactModalOpen(true)}
                className="inline-flex items-center gap-2 text-credita dark:text-neon-blue hover:opacity-80 font-medium text-sm transition-colors"
              >
                <FileUp className="w-4 h-4" />
                Contact Support
              </button>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-slate-400 dark:text-slate-500 text-xs">© 2026 Credita. All rights reserved. Confidential and Proprietary.</p>
          </div>
        </div>
      </footer>

      {/* Contact Support Modal */}
      <AnimatePresence>
        {isContactModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsContactModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden transition-colors duration-300"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-credita/10 dark:bg-neon-blue/10 rounded-xl flex items-center justify-center">
                      <FileUp className="text-credita dark:text-neon-blue w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Contact Support</h3>
                  </div>
                  <button 
                    onClick={() => {
                      setIsContactModalOpen(false);
                      setContactSuccess(false);
                    }}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                  </button>
                </div>

                {contactSuccess ? (
                  <div className="text-center py-8">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                    </div>
                    <h4 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Message Sent!</h4>
                    <p className="text-slate-600 dark:text-slate-400 mb-8">Thank you for reaching out. We'll get back to you as soon as possible.</p>
                    <button 
                      onClick={() => {
                        setIsContactModalOpen(false);
                        setContactSuccess(false);
                      }}
                      className="w-full bg-slate-900 dark:bg-neon-blue text-white py-4 rounded-xl font-bold hover:bg-slate-800 dark:hover:opacity-90 transition-all"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setIsSubmittingContact(true);
                      try {
                        // 1. Save to Firestore (Backup & Website View)
                        const messageId = Math.random().toString(36).substr(2, 9);
                        await setDocument('support_messages', messageId, {
                          id: messageId,
                          name: contactForm.name,
                          email: contactForm.email,
                          message: contactForm.message,
                          createdAt: Timestamp.now()
                        });

                        // 2. Send Real Email via FormSubmit (Easiest way, no setup needed)
                        // This will send the email directly to your inbox
                        await fetch('https://formsubmit.co/ajax/mostafa.elzeiny11@gmail.com', {
                          method: 'POST',
                          headers: { 
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                          },
                          body: JSON.stringify({
                            name: contactForm.name,
                            email: contactForm.email,
                            message: contactForm.message,
                            _subject: `Credita Support: New message from ${contactForm.name}`,
                            _template: 'table'
                          })
                        });

                        setContactSuccess(true);
                        setContactForm({ name: '', email: '', message: '' });
                      } catch (error) {
                        console.error('Contact error:', error);
                        alert('An error occurred. Please try again.');
                      } finally {
                        setIsSubmittingContact(false);
                      }
                    }}
                    className="space-y-4"
                  >
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                    <input 
                      type="text" 
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-credita/20 dark:focus:ring-neon-blue/20 focus:border-credita dark:focus:border-neon-blue outline-none transition-all dark:text-white"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-credita/20 dark:focus:ring-neon-blue/20 focus:border-credita dark:focus:border-neon-blue outline-none transition-all dark:text-white"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Message</label>
                    <textarea 
                      required
                      rows={4}
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-credita/20 dark:focus:ring-neon-blue/20 focus:border-credita dark:focus:border-neon-blue outline-none transition-all dark:text-white resize-none"
                      placeholder="Describe your issue or request..."
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={isSubmittingContact}
                    className="w-full bg-credita dark:bg-neon-blue text-white py-4 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-slate-100 dark:shadow-none flex items-center justify-center gap-2"
                  >
                    {isSubmittingContact ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                    Send Message
                  </button>
                </form>
                )}
              </div>
            </motion.div>
          </div>
        )}


      </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function EditableCell({
  value,
  fileId,
  onValueChange
}: {
  value: number;
  fileId: string;
  onValueChange: (fileId: string, newValue: string) => void;
}) {
  const formattedDefault = (value / 1000).toLocaleString('en-US');
  const [localVal, setLocalVal] = useState(formattedDefault);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setLocalVal((value / 1000).toLocaleString('en-US'));
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9.]/g, '');
    if (raw === '') {
      setLocalVal('');
      return;
    }
    const parts = raw.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    setLocalVal(parts.join('.'));
  };

  const handleBlur = () => {
    setIsFocused(false);
    const numericValue = localVal.replace(/,/g, '');
    onValueChange(fileId, numericValue);
  };

  return (
    <input 
      type="text"
      value={localVal}
      onFocus={() => setIsFocused(true)}
      onChange={handleChange}
      onBlur={handleBlur}
      className="w-32 text-right bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 focus:ring-1 focus:ring-credita dark:focus:ring-neon-blue focus:border-credita dark:focus:border-neon-blue outline-none transition-all dark:text-slate-100"
    />
  );
}

const TableRow = memo(function TableRow({ 
  label, 
  values, 
  format, 
  isBold = false, 
  isHighlight = false,
  isNegative = false,
  isEditable = false,
  onValueChange,
  fileIds = [],
  notes = []
}: { 
  label: string; 
  values: number[]; 
  format: (v: number) => string; 
  isBold?: boolean;
  isHighlight?: boolean;
  isNegative?: boolean;
  isEditable?: boolean;
  onValueChange?: (fileId: string, newValue: string) => void;
  fileIds?: string[];
  notes?: string[];
}) {
  return (
    <tr className={`${isHighlight ? 'bg-credita/5 dark:bg-neon-blue/5' : ''} hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors`}>
      <td className={`py-3 px-6 text-sm ${isBold ? 'font-bold text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}>
        <div className="flex items-center gap-2">
          {label}
          {notes.some(n => n) && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal italic">
              (Notes: {notes.filter(n => n).join(', ')})
            </span>
          )}
        </div>
      </td>
      {values.map((v, i) => (
        <td key={i} className={`py-2 px-6 text-sm text-right font-mono ${isBold ? 'font-bold text-blue-700 dark:text-neon-blue' : 'text-blue-600 dark:text-blue-400'} ${isNegative && v > 0 ? 'text-red-500 dark:text-red-400' : ''}`}>
          {isEditable && onValueChange && fileIds[i] ? (
            <EditableCell
              value={v}
              fileId={fileIds[i]}
              onValueChange={onValueChange}
            />
          ) : (
            format(v)
          )}
        </td>
      ))}
    </tr>
  );
});

function AuthScreen({ 
  onLogin, 
  user, 
  needsVerification 
}: { 
  onLogin: () => void; 
  user: User | null;
  needsVerification?: boolean;
}) {
  const [isSignup, setIsSignup] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    const isAdminEmail = email.toLowerCase() === 'mostafa.elzeiny11@gmail.com';
    
    if (isSignup && password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      if (isSignup) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        setSuccessMessage("Verification email sent! Please check your inbox and verify your email before signing in.");
        setIsSignup(false);
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified && email.toLowerCase() !== 'mostafa.elzeiny11@gmail.com') {
          setError("Please verify your email before signing in. Check your inbox for the verification link.");
          await signOut(auth);
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let msg = 'Authentication failed';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        msg = 'Invalid email or password. Please check your credentials or sign up if you don\'t have an account.';
      } else if (err.code === 'auth/wrong-password') {
        msg = 'Incorrect password. You can reset it using the "Forgot password?" link below.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'This email is already registered. Please sign in instead.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many failed attempts. Please try again later or reset your password.';
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      await sendEmailVerification(user);
      setSuccessMessage("Verification email resent! Please check your inbox.");
    } catch (err: any) {
      setError(err.message || "Failed to resend verification email");
    } finally {
      setIsLoading(false);
    }
  };

  if (needsVerification) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center">
            <div className="w-20 h-20 bg-credita/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-credita" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Verify your email</h2>
            <p className="text-slate-500 mb-6">
              We've sent a verification email to <span className="font-semibold text-slate-900">{user?.email}</span>. 
              Please verify your email to access your account.
            </p>
            
            {successMessage && (
              <div className="mb-6 p-3 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-medium">
                {successMessage}
              </div>
            )}

            <div className="space-y-3">
              <button 
                onClick={() => window.location.reload()}
                className="w-full bg-credita text-white py-4 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg"
              >
                I've verified my email
              </button>
              <button 
                onClick={handleResendVerification}
                disabled={isLoading}
                className="w-full bg-white border border-slate-200 text-slate-700 py-4 rounded-xl font-bold hover:bg-slate-50 transition-all"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Resend verification email'}
              </button>
              <button 
                onClick={() => signOut(auth)}
                className="w-full text-slate-400 text-sm font-semibold hover:text-slate-600"
              >
                Sign out and try another account
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address first");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const actionCodeSettings = {
        // This URL must be added to Authorized Domains in Firebase
        url: window.location.origin,
        handleCodeInApp: true,
      };
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      setSuccessMessage("Password reset email sent! Check your inbox (and Spam folder).");
      setIsResetting(false);
    } catch (err: any) {
      console.error('Reset error:', err);
      setError(err.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  if (isResetting) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-deep-navy flex flex-col items-center justify-center p-4 transition-colors duration-300">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Reset Password</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">Enter your email and we'll send you a link to reset your password.</p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-credita/20 dark:focus:ring-neon-blue/20 focus:border-credita dark:focus:border-neon-blue outline-none transition-all dark:text-white"
                  placeholder="name@company.com"
                />
              </div>
              {error && <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">{error}</div>}
              <button type="submit" disabled={isLoading} className="w-full bg-credita dark:bg-neon-blue text-white py-4 rounded-xl font-bold hover:opacity-90 transition-opacity">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Send Reset Link'}
              </button>
              <button type="button" onClick={() => setIsResetting(false)} className="w-full text-slate-500 dark:text-slate-400 text-sm font-semibold hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                Back to Login
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
      {/* Animated Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-credita/5 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div className="flex flex-col items-center justify-center mb-6">
            <motion.img 
              layoutId="main-logo"
              src="https://lh3.googleusercontent.com/d/11M23dOt1x49ZRANgrZyhvY0sWL0Y7EQB" 
              alt="Credita Name" 
              className="h-32 w-auto object-contain drop-shadow-2xl"
              referrerPolicy="no-referrer"
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            />
          </div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-black text-slate-900 tracking-tight"
          >
            {isSignup ? 'Create account' : 'Welcome back'}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-slate-500 mt-2 font-medium"
          >
            {isSignup ? 'Join Credita to start analyzing statements' : 'Login to access your dashboard'}
          </motion.p>
        </div>

        <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-white/40 p-8">
          <form onSubmit={handleEmailAuth} className="space-y-5 mb-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white/50 focus:ring-4 focus:ring-credita/10 focus:border-credita outline-none transition-all placeholder:text-slate-400"
                placeholder="name@company.com"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5 ml-1">
                <label className="block text-sm font-bold text-slate-700">Password</label>
                {!isSignup && (
                  <button type="button" onClick={() => setIsResetting(true)} className="text-xs text-credita font-bold hover:underline">
                    Forgot password?
                  </button>
                )}
              </div>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white/50 focus:ring-4 focus:ring-credita/10 focus:border-credita outline-none transition-all placeholder:text-slate-400"
                placeholder="••••••••"
              />
            </div>

            {isSignup && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Confirm Password</label>
                <input 
                  type="password" 
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white/50 focus:ring-4 focus:ring-credita/10 focus:border-credita outline-none transition-all placeholder:text-slate-400"
                  placeholder="••••••••"
                />
              </motion.div>
            )}
            
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 text-red-600 text-sm bg-red-50/50 backdrop-blur-sm p-4 rounded-2xl border border-red-100"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="font-medium">{error}</span>
              </motion.div>
            )}

            {successMessage && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 text-emerald-700 text-sm bg-emerald-50/50 backdrop-blur-sm p-4 rounded-2xl border border-emerald-100"
              >
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span className="font-medium">{successMessage}</span>
              </motion.div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-credita text-white py-4.5 rounded-2xl font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-[0_20px_40px_-12px_rgba(196,30,58,0.3)] flex items-center justify-center gap-2 text-lg"
            >
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (isSignup ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-4 bg-white/0 text-slate-400 font-bold uppercase tracking-widest">Or</span>
            </div>
          </div>

          <button 
            onClick={onLogin}
            className="w-full bg-white border border-slate-200 text-slate-700 py-4 rounded-2xl font-bold hover:bg-slate-50 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-sm group"
          >
            <img src="https://www.google.com/favicon.ico" alt="" className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Continue with Google</span>
          </button>

          <div className="mt-8 text-center">
            <button 
              onClick={() => {
                setIsSignup(!isSignup);
                setError(null);
                setSuccessMessage(null);
              }}
              className="text-credita font-bold hover:underline decoration-2 underline-offset-4"
            >
              {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>

        <p className="text-center text-slate-400 text-[10px] mt-10 font-bold uppercase tracking-widest leading-relaxed">
          By continuing, you agree to Credita's<br/>
          <span className="text-slate-500 cursor-pointer hover:text-credita">Terms of Service</span> and <span className="text-slate-500 cursor-pointer hover:text-credita">Privacy Policy</span>.
        </p>
      </motion.div>
    </div>
  );
}
