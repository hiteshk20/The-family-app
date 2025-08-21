import { GoogleGenAI } from "@google/genai";

// This app does not use the Gemini API.
// const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

declare var Chart: any;

const App = {
    state: {
        user: {
            name: null,
            language: 'hi',
            theme: 'light'
        },
        transactions: [] as any[],
        investments: {},
        currentPage: 'dashboard',
    },

    // --- I18N (Localization) ---
    strings: {
        hi: {
            welcomeTitle: "परिवार बजट ऐप में आपका स्वागत है",
            welcomeMessage: "शुरू करने के लिए कृपया अपना नाम दर्ज करें।",
            continue: "आगे बढ़ें",
            navHome: "होम",
            navTransactions: "लेन-देन",
            navInvest: "निवेश",
            navSettings: "सेटिंग्स",
            greeting: "नमस्ते, {name} जी!",
            dashboardTitle: "डैशबोर्ड",
            totalIncome: "कुल आय",
            totalExpenses: "कुल खर्च",
            savings: "बचत",
            investments: "निवेश",
            expenseDistribution: "खर्च का वितरण",
            incomeVsExpense: "आय बनाम खर्च",
            recentTransactions: "हाल के लेन-देन",
            viewAll: "सभी देखें",
            addTransaction: "नया लेन-देन जोड़ें",
            expense: "खर्च",
            income: "आय",
            save: "सहेजें",
            amount: "रकम",
            category: "श्रेणी",
            date: "तारीख",
            notes: "नोट्स",
            settingsTitle: "सेटिंग्स",
            darkMode: "डार्क मोड",
            language: "भाषा",
            exportData: "डेटा निर्यात करें (CSV)",
            resetApp: "ऐप रीसेट करें",
            confirmReset: "क्या आप वाकई अपना सारा डेटा मिटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।",
            // Categories
            'salary': 'वेतन', 'business': 'स्व-रोज़गार', 'freelance': 'फ्रीलांस', 'rent': 'किराया', 'interest': 'ब्याज', 'pension': 'पेंशन', 'other_income': 'अन्य',
            'housing': 'घर/आवास', 'kitchen': 'रसोई', 'education': 'शिक्षा', 'transport': 'यातायात', 'health': 'स्वास्थ्य', 'utilities': 'मोबाइल/इंटरनेट', 'personal': 'व्यक्तिगत', 'entertainment': 'मनोरंजन', 'social': 'सामाजिक/त्यौहार',
            // Investment Wizard
            investmentWizard: "निवेश सेटअप विज़ार्ड",
            step1: "आपातकालीन निधि",
            step2: "कर्ज़ प्राथमिकता",
            step3: "निवेश योजना",
            step4: "बीमा रिकॉर्ड",
            step5: "सारांश",
            monthlyExpensesPrompt: "अपने औसत मासिक खर्च दर्ज करें",
            calculate: "गणना करें",
            emergencyFundGoal: "आपका आपातकालीन निधि लक्ष्य (6 महीने):",
            next: "अगला",
            back: "पिछला",
            finish: "समाप्त",
        },
        en: {
            welcomeTitle: "Welcome to the Family Budget App",
            welcomeMessage: "Please enter your name to get started.",
            continue: "Continue",
            navHome: "Home",
            navTransactions: "Transactions",
            navInvest: "Invest",
            navSettings: "Settings",
            greeting: "Hello, {name}!",
            dashboardTitle: "Dashboard",
            totalIncome: "Total Income",
            totalExpenses: "Total Expenses",
            savings: "Savings",
            investments: "Investments",
            expenseDistribution: "Expense Distribution",
            incomeVsExpense: "Income vs. Expense",
            recentTransactions: "Recent Transactions",
            viewAll: "View All",
            addTransaction: "Add New Transaction",
            expense: "Expense",
            income: "Income",
            save: "Save",
            amount: "Amount",
            category: "Category",
            date: "Date",
            notes: "Notes",
            settingsTitle: "Settings",
            darkMode: "Dark Mode",
            language: "Language",
            exportData: "Export Data (CSV)",
            resetApp: "Reset App",
            confirmReset: "Are you sure you want to delete all your data? This action cannot be undone.",
            // Categories
            'salary': 'Salary', 'business': 'Business', 'freelance': 'Freelance', 'rent': 'Rent', 'interest': 'Interest', 'pension': 'Pension', 'other_income': 'Other',
            'housing': 'Housing', 'kitchen': 'Groceries', 'education': 'Education', 'transport': 'Transport', 'health': 'Health', 'utilities': 'Utilities', 'personal': 'Personal', 'entertainment': 'Entertainment', 'social': 'Social/Festivals',
            // Investment Wizard
            investmentWizard: "Investment Setup Wizard",
            step1: "Emergency Fund",
            step2: "Debt Priority",
            step3: "Investment Plan",
            step4: "Insurance Records",
            step5: "Summary",
            monthlyExpensesPrompt: "Enter your average monthly expenses",
            calculate: "Calculate",
            emergencyFundGoal: "Your Emergency Fund Goal (6 months):",
            next: "Next",
            back: "Previous",
            finish: "Finish",
        }
    },

    t: function(key: string, replacements = {}) {
        let str = (this.strings as any)[this.state.user.language][key] || key;
        for (const placeholder in replacements) {
            str = str.replace(`{${placeholder}}`, (replacements as any)[placeholder]);
        }
        return str;
    },
    
    // --- State Management ---
    init: function() {
        this.transactions.parent = this;
        this.modals.parent = this;
        this.investmentWizard.parent = this;
        
        this.loadState();
        this.applyTheme();
        
        if (!this.state.user.name) {
            this.showOnboarding();
        } else {
            this.showMainApp();
        }
        this.addEventListeners();
        this.updateUI();
    },

    loadState: function() {
        const savedState = localStorage.getItem('budgetApp');
        if (savedState) {
            this.state = JSON.parse(savedState);
        }
    },

    saveState: function() {
        localStorage.setItem('budgetApp', JSON.stringify(this.state));
    },

    // --- UI Rendering & Updates ---
    updateUI: function() {
        this.updateAllText();
        this.renderPage();
    },

    updateAllText: function() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.textContent = this.t(key!);
        });
        if (this.state.user.name) {
            document.getElementById('greeting')!.textContent = this.t('greeting', {name: this.state.user.name});
        }
    },
    
    renderPage: function() {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(`page-${this.state.currentPage}`)!.classList.add('active');
        
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', (btn as HTMLElement).dataset.page === this.state.currentPage);
        });

        switch(this.state.currentPage) {
            case 'dashboard': this.renderDashboard(); break;
            case 'transactions': this.renderTransactionsPage('all'); break;
            case 'settings': this.renderSettingsPage(); break;
        }
    },
    
    // --- Onboarding ---
    showOnboarding: function() {
        document.getElementById('onboarding-modal')!.classList.remove('hidden');
    },

    handleOnboarding: function(e: Event) {
        e.preventDefault();
        const nameInput = document.getElementById('name-input') as HTMLInputElement;
        if (nameInput.value.trim()) {
            this.state.user.name = nameInput.value.trim();
            this.saveState();
            document.getElementById('onboarding-modal')!.classList.add('hidden');
            this.showMainApp();
            this.updateUI();
        }
    },

    showMainApp: function() {
        document.getElementById('main-content')!.classList.remove('hidden');
        document.getElementById('bottom-nav')!.classList.remove('hidden');
    },

    // --- Pages Rendering ---
    renderDashboard: function() {
        const page = document.getElementById('page-dashboard')!;
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const monthlyIncome = this.getMonthlyTotal('income', currentMonth, currentYear);
        const monthlyExpenses = this.getMonthlyTotal('expense', currentMonth, currentYear);
        const savings = monthlyIncome - monthlyExpenses;

        page.innerHTML = `
            <div class="dashboard-grid">
                <div class="card">
                    <div class="card-header"><span class="card-title">${this.t('totalIncome')}</span></div>
                    <p class="card-amount income">₹${monthlyIncome.toLocaleString('en-IN')}</p>
                </div>
                <div class="card">
                    <div class="card-header"><span class="card-title">${this.t('totalExpenses')}</span></div>
                    <p class="card-amount expense">₹${monthlyExpenses.toLocaleString('en-IN')}</p>
                </div>
                <div class="card">
                    <div class="card-header"><span class="card-title">${this.t('savings')}</span></div>
                    <p class="card-amount">₹${savings.toLocaleString('en-IN')}</p>
                </div>
                <div class="card" id="investments-card">
                    <div class="card-header"><span class="card-title">${this.t('investments')}</span></div>
                    <p class="card-amount">₹0</p>
                </div>
            </div>

            <div class="card">
                <h3 class="card-title">${this.t('expenseDistribution')}</h3>
                <div class="chart-container"><canvas id="expensePieChart"></canvas></div>
            </div>
            
            <div class="card">
                 <div class="card-header">
                    <h3 class="card-title">${this.t('recentTransactions')}</h3>
                    <a href="#" id="view-all-transactions" class="view-all">${this.t('viewAll')}</a>
                </div>
                <ul class="transaction-list">
                    ${this.transactions.getRecent(5).map(t => this.transactions.renderItem(t)).join('')}
                </ul>
            </div>
        `;
        this.renderExpensePieChart();
        (document.getElementById('view-all-transactions') as HTMLElement).onclick = () => this.navigateTo('transactions');
        (document.getElementById('investments-card') as HTMLElement).onclick = () => this.investmentWizard.start();
    },

    renderTransactionsPage: function(filter = 'all') {
        const page = document.getElementById('page-transactions')!;
        page.innerHTML = `
            <h2>${this.t('navTransactions')}</h2>
            <ul class="transaction-list">
                ${this.transactions.getAll().map(t => this.transactions.renderItem(t)).join('')}
            </ul>
        `;
    },

    renderSettingsPage: function() {
        const page = document.getElementById('page-settings')!;
        page.innerHTML = `
            <h2>${this.t('settingsTitle')}</h2>
            <div class="settings-group">
                <h3>${this.t('darkMode')}</h3>
                <div class="settings-item">
                    <span>${this.t('darkMode')}</span>
                    <label class="switch">
                        <input type="checkbox" id="theme-toggle" ${this.state.user.theme === 'dark' ? 'checked' : ''}>
                        <span class="slider round"></span>
                    </label>
                </div>
            </div>
            <div class="settings-group">
                <h3>${this.t('language')}</h3>
                <div class="settings-item language-selector">
                    <span>${this.t('language')}</span>
                    <div>
                        <button id="lang-hi" class="${this.state.user.language === 'hi' ? 'active' : ''}">हिन्दी</button>
                        <button id="lang-en" class="${this.state.user.language === 'en' ? 'active' : ''}">English</button>
                    </div>
                </div>
            </div>
            <div class="settings-group">
                <h3>Data</h3>
                <div class="settings-item">
                    <button id="export-data-btn" style="width:100%; text-align: left; background: none; color: var(--text-color); padding: 0;">${this.t('exportData')}</button>
                </div>
                <div class="settings-item">
                    <button id="reset-app-btn" style="width:100%; text-align: left; background: none; color: var(--accent-red); padding: 0;">${this.t('resetApp')}</button>
                </div>
            </div>
        `;
    },

    // --- Charting ---
    charts: {} as any,
    renderExpensePieChart: function() {
        const ctx = (document.getElementById('expensePieChart') as HTMLCanvasElement)?.getContext('2d');
        if (!ctx) return;

        const expenseData = this.transactions.getCategoryTotals('expense');
        const labels = Object.keys(expenseData).map(key => this.t(key));
        const data = Object.values(expenseData);

        if (this.charts.expensePie) {
            this.charts.expensePie.destroy();
        }
        
        if (data.length === 0) {
            ctx.font = "16px " + getComputedStyle(document.body).fontFamily;
            ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-secondary-color');
            ctx.textAlign = "center";
            ctx.fillText("No expense data for this month.", ctx.canvas.width / 2, ctx.canvas.height / 2);
            return;
        }

        this.charts.expensePie = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: ['#e74c3c', '#3498db', '#9b59b6', '#f1c40f', '#2ecc71', '#1abc9c', '#e67e22'],
                    borderColor: getComputedStyle(document.body).getPropertyValue('--surface-color'),
                    borderWidth: 2,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: getComputedStyle(document.body).getPropertyValue('--text-color'),
                            padding: 15,
                        }
                    }
                },
                animation: {
                    animateScale: true,
                    animateRotate: true
                }
            }
        });
    },

    // --- Data Calculation ---
    getMonthlyTotal: function(type: string, month: number, year: number) {
        return this.state.transactions
            .filter(t => {
                const date = new Date(t.date);
                return t.type === type && date.getMonth() === month && date.getFullYear() === year;
            })
            .reduce((sum, t) => sum + t.amount, 0);
    },

    // --- Navigation & Event Handling ---
    addEventListeners: function() {
        document.getElementById('onboarding-form')!.addEventListener('submit', this.handleOnboarding.bind(this));
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => this.navigateTo((btn as HTMLElement).dataset.page!));
        });
        document.getElementById('add-transaction-btn')!.addEventListener('click', () => this.modals.showTransactionModal());
        document.querySelector('.close-modal-btn')!.addEventListener('click', () => this.modals.hideTransactionModal());
        document.getElementById('transaction-form')!.addEventListener('submit', this.transactions.handleAdd.bind(this.transactions));
        document.getElementById('transaction-type-toggle')!.addEventListener('change', this.modals.updateTransactionForm.bind(this.modals));

        // Use event delegation for settings page elements which are re-rendered
        document.body.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target.id === 'theme-toggle') {
                this.toggleTheme((target as HTMLInputElement).checked);
            } else if (target.id === 'lang-hi') {
                this.changeLanguage('hi');
            } else if (target.id === 'lang-en') {
                this.changeLanguage('en');
            } else if (target.id === 'export-data-btn') {
                this.exportData();
            } else if (target.id === 'reset-app-btn') {
                this.resetApp();
            }
        });
    },

    navigateTo: function(page: string) {
        if(page === 'investments'){
             this.investmentWizard.start();
             return;
        }
        this.state.currentPage = page;
        this.renderPage();
        this.saveState();
    },

    // --- Settings Logic ---
    applyTheme: function() {
        document.documentElement.setAttribute('data-theme', this.state.user.theme);
    },

    toggleTheme: function(isDark: boolean) {
        this.state.user.theme = isDark ? 'dark' : 'light';
        this.applyTheme();
        this.saveState();
        this.renderPage(); // Re-render to update chart colors
    },

    changeLanguage: function(lang: string) {
        this.state.user.language = lang;
        this.saveState();
        this.updateUI();
    },

    exportData: function() {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Type,Category,Amount,Date,Notes\n";
        this.state.transactions.forEach(t => {
            const row = [t.type, t.category, t.amount, t.date, `"${t.notes || ''}"`].join(',');
            csvContent += row + "\r\n";
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "budget_data.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    resetApp: function() {
        if (confirm(this.t('confirmReset'))) {
            localStorage.removeItem('budgetApp');
            window.location.reload();
        }
    },
    
    // Sub-modules for organization
    transactions: {
        parent: null as any,
        incomeCategories: ['salary', 'business', 'freelance', 'rent', 'interest', 'pension', 'other_income'],
        expenseCategories: ['housing', 'kitchen', 'education', 'transport', 'health', 'utilities', 'personal', 'entertainment', 'social'],
        
        getAll() {
            return [...this.parent.state.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        },
        
        getRecent(count: number) {
            return this.getAll().slice(0, count);
        },
        
        getCategoryTotals(type: string) {
            const now = new Date();
            return this.parent.state.transactions
                .filter((t: any) => {
                    const date = new Date(t.date);
                    return t.type === type && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                })
                .reduce((acc: any, t: any) => {
                    acc[t.category] = (acc[t.category] || 0) + t.amount;
                    return acc;
                }, {});
        },

        handleAdd(e: Event) {
            e.preventDefault();
            const type = (document.getElementById('transaction-type-toggle') as HTMLInputElement).checked ? 'income' : 'expense';
            const amount = parseFloat((document.getElementById('transaction-amount') as HTMLInputElement).value);
            const category = (document.getElementById('transaction-category') as HTMLSelectElement).value;
            const date = (document.getElementById('transaction-date') as HTMLInputElement).value;
            const notes = (document.getElementById('transaction-notes') as HTMLInputElement).value;

            if (!amount || !category || !date) return;

            this.parent.state.transactions.push({ id: Date.now(), type, amount, category, date, notes });
            this.parent.saveState();
            this.parent.modals.hideTransactionModal();
            this.parent.renderPage();
        },
        
        renderItem(t: any) {
            return `
                <li class="transaction-item">
                    <div class="transaction-icon ${t.type}">
                        <span>${t.type === 'income' ? '₹' : ' खर्च '}</span>
                    </div>
                    <div class="transaction-details">
                        <span class="transaction-category">${this.parent.t(t.category)}</span>
                        <span class="transaction-date">${new Date(t.date).toLocaleDateString()}</span>
                    </div>
                    <span class="transaction-amount ${t.type}">
                      ${t.type === 'income' ? '+' : '-'}₹${t.amount.toLocaleString('en-IN')}
                    </span>
                </li>
            `;
        }
    },

    modals: {
        parent: null as any,
        showTransactionModal() {
            document.getElementById('transaction-modal')!.classList.remove('hidden');
            (document.getElementById('transaction-date') as HTMLInputElement).valueAsDate = new Date();
            this.updateTransactionForm();
        },
        hideTransactionModal() {
            document.getElementById('transaction-modal')!.classList.add('hidden');
            (document.getElementById('transaction-form') as HTMLFormElement).reset();
        },
        updateTransactionForm() {
            const isIncome = (document.getElementById('transaction-type-toggle') as HTMLInputElement).checked;
            document.getElementById('transaction-type-label')!.textContent = isIncome ? this.parent.t('income') : this.parent.t('expense');
            const categories = isIncome ? this.parent.transactions.incomeCategories : this.parent.transactions.expenseCategories;
            const categorySelect = document.getElementById('transaction-category')!;
            categorySelect.innerHTML = categories.map(c => `<option value="${c}">${this.parent.t(c)}</option>`).join('');
        }
    },
    
    investmentWizard: {
        parent: null as any,
        currentStep: 1,
        data: {} as any,

        start() {
            this.currentStep = 1;
            this.data = {};
            this.render();
            document.getElementById('investment-wizard-modal')!.classList.remove('hidden');
        },

        render() {
            const modal = document.getElementById('investment-wizard-modal')!;
            modal.innerHTML = `
                <div class="modal-content wizard-content">
                    <button class="close-modal-btn">&times;</button>
                    <h2>${this.parent.t('investmentWizard')}</h2>
                    <div class="wizard-progress-bar">
                        <div class="wizard-progress" style="width: ${this.currentStep * 20}%"></div>
                    </div>

                    ${this.getStepContent(this.currentStep)}
                    
                    <div class="wizard-navigation">
                        <button id="wizard-back" ${this.currentStep === 1 ? 'disabled' : ''}>${this.parent.t('back')}</button>
                        <button id="wizard-next">${this.currentStep === 5 ? this.parent.t('finish') : this.parent.t('next')}</button>
                    </div>
                </div>
            `;
            this.addWizardListeners();
        },

        getStepContent(step: number) {
            switch(step) {
                case 1: return `
                    <div id="step-1" class="wizard-step active">
                        <h3>${this.parent.t('step1')}</h3>
                        <p>${this.parent.t('monthlyExpensesPrompt')}</p>
                        <input type="number" id="monthly-expenses-input" placeholder="₹50,000">
                        <button id="calculate-emergency-fund">${this.parent.t('calculate')}</button>
                        <div id="emergency-fund-result" class="result-display" style="display:none;"></div>
                    </div>`;
                case 2: return `<div id="step-2" class="wizard-step active"><h3>${this.parent.t('step2')}</h3><p>कर्ज़ प्राथमिकता सुविधा जल्द ही आ रही है।</p></div>`;
                case 3: return `<div id="step-3" class="wizard-step active"><h3>${this.parent.t('step3')}</h3><p>निवेश योजना सुविधा जल्द ही आ रही है।</p></div>`;
                case 4: return `<div id="step-4" class="wizard-step active"><h3>${this.parent.t('step4')}</h3><p>बीमा रिकॉर्ड सुविधा जल्द ही आ रही है।</p></div>`;
                case 5: return `<div id="step-5" class="wizard-step active"><h3>${this.parent.t('step5')}</h3><p>आपका निवेश डैशबोर्ड जल्द ही यहां उपलब्ध होगा।</p></div>`;
                default: return '';
            }
        },

        addWizardListeners() {
            (document.querySelector('#investment-wizard-modal .close-modal-btn') as HTMLElement).onclick = () => this.close();
            (document.getElementById('wizard-back') as HTMLButtonElement).onclick = () => this.navigate(-1);
            (document.getElementById('wizard-next') as HTMLButtonElement).onclick = () => this.navigate(1);
            
            if (this.currentStep === 1) {
                (document.getElementById('calculate-emergency-fund') as HTMLButtonElement).onclick = () => {
                    const input = document.getElementById('monthly-expenses-input') as HTMLInputElement;
                    const expenses = parseFloat(input.value);
                    if (expenses > 0) {
                        const goal = expenses * 6;
                        this.data.emergencyFundGoal = goal;
                        const resultDiv = document.getElementById('emergency-fund-result')!;
                        resultDiv.textContent = `${this.parent.t('emergencyFundGoal')} ₹${goal.toLocaleString('en-IN')}`;
                        resultDiv.style.display = 'block';
                    }
                };
            }
        },

        navigate(direction: number) {
            if (this.currentStep === 5 && direction === 1) {
                this.close();
                return;
            }
            this.currentStep += direction;
            this.render();
        },

        close() {
            document.getElementById('investment-wizard-modal')!.classList.add('hidden');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
