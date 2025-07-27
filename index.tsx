/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { Chart, registerables, ChartDataset } from 'chart.js/auto';
import 'chart.js/auto'; // Required for time scale

// Register all Chart.js components
Chart.register(...registerables);

// --- DOM Element References ---
const controlsContainer = document.getElementById('controls-container') as HTMLElement;
const mainTitle = document.getElementById('main-title') as HTMLHeadingElement;
const chartContainerWrapper = document.getElementById('chart-container-wrapper') as HTMLElement;
const summaryCard = document.getElementById('summary-card') as HTMLElement;
const summaryContent = document.getElementById('summary-content') as HTMLElement; // Updated
const tableContainerWrapper = document.getElementById('table-container-wrapper') as HTMLElement;
const tableContainer = document.getElementById('table-container') as HTMLElement;
const tableTitle = document.getElementById('table-title') as HTMLElement;
const quoteContainer = document.getElementById('quote-container') as HTMLElement;
const quoteTextElement = document.querySelector('#quote-container .quote-text') as HTMLParagraphElement;
const quoteAuthorElement = document.querySelector('#quote-container .quote-author') as HTMLParagraphElement;


// --- State Management ---
let state = {
    useAge: false,
    currentAge: null as number | null,
    initialCapital: 0,
    monthlyInvestment: 500,
    contributionPeriod: 10,
    simulationPeriod: 20,
    withdrawalAmount: 0,
    withdrawalStartYear: 0,
    selectedReturns: [15], // in percent
    isBitcoinContext: true
};

// --- Global Chart Instances ---
let investmentChart: Chart | null = null;
let quoteInterval: ReturnType<typeof setInterval> | null = null;

// --- Interfaces ---
interface ScenarioData {
    portfolio: number[];
    btcPrice: number[];
    withdrawals: number[];
}

// --- Constants ---
const DATASET_COLORS = [
    { border: '#36B37E', bg: 'rgba(54, 179, 126, 0.1)' },  // Green
    { border: '#0052FF', bg: 'rgba(0, 82, 255, 0.1)' },    // Blue
    { border: '#FFAB00', bg: 'rgba(255, 171, 0, 0.1)' },  // Yellow
    { border: '#FF5630', bg: 'rgba(255, 86, 48, 0.1)' },   // Orange
    { border: '#6554C0', bg: 'rgba(101, 84, 192, 0.1)'},  // Purple
    { border: '#DE350B', bg: 'rgba(222, 53, 11, 0.1)' },   // Red
    { border: '#00B8D9', bg: 'rgba(0, 184, 217, 0.1)'},   // Cyan (for custom)
];
const PREDEFINED_RETURNS = [5, 10, 15, 20];
const CUSTOM_RETURN_COLOR = DATASET_COLORS[6];
const INITIAL_BTC_PRICE = 100000;

const QUOTES = [
    // Finance & Investing
    { text: "Der Preis ist, was du zahlst. Der Wert ist, was du bekommst.", author: "Warren Buffett" },
    { text: "Zinseszins ist das achte Weltwunder. Wer ihn versteht, verdient ihn; wer nicht, bezahlt ihn.", author: "Albert Einstein (zugeschrieben)" },
    { text: "Sei ängstlich, wenn andere gierig sind, und gierig, wenn andere ängstlich sind.", author: "Warren Buffett" },
    { text: "Der beste Zeitpunkt, einen Baum zu pflanzen, war vor 20 Jahren. Der zweitbeste Zeitpunkt ist jetzt.", author: "Chinesisches Sprichwort" },
    { text: "Es geht nicht darum, den Markt zu timen, sondern um die Zeit im Markt.", author: "John C. Bogle" },
    { text: "Das größte Risiko von allen ist, kein Risiko einzugehen.", author: "Unbekannt" },
    { text: "Investiere in dich selbst. Es ist die beste Investition, die du tätigen wirst.", author: "Unbekannt" },
    { text: "Der Reiche herrscht über die Armen; und der Borgende ist ein Knecht des Leihenden.", author: "Sprüche 22:7" },
    { text: "Spare in der Zeit, so hast du in der Not.", author: "Deutsches Sprichwort" },
    { text: "Diversifikation ist ein Schutz gegen Unwissenheit. Sie macht sehr wenig Sinn für diejenigen, die wissen, was sie tun.", author: "Warren Buffett" },
    { text: "Kaufe nur etwas, das du auch gerne besitzen würdest, wenn die Börse für 10 Jahre schließt.", author: "Warren Buffett" },
    { text: "Gelegenheiten kommen unregelmäßig. Wenn es Gold regnet, stell einen Eimer vor die Tür, keinen Fingerhut.", author: "Warren Buffett" },
    { text: "Der Aktienmarkt ist ein Instrument, um Geld von den Ungeduldigen zu den Geduldigen zu transferieren.", author: "Warren Buffett" },
    { text: "Die vier teuersten Worte im Englischen sind: 'This time it's different'.", author: "Sir John Templeton" },
    { text: "Erfolg ist ein lausiger Lehrer. Er verführt kluge Leute zu dem Glauben, sie könnten nicht verlieren.", author: "Bill Gates" },

    // Stoicism & Philosophy
    { text: "Vermögen besteht nicht im Besitz von Gütern, sondern in der Kunst, mit wenigem auszukommen.", author: "Epikur" },
    { text: "Nicht der Mensch, der wenig hat, sondern der, der mehr wünscht, ist arm.", author: "Seneca" },
    { text: "Wenn du nach den Gesetzen der Natur lebst, wirst du niemals arm sein; wenn du nach den Meinungen der Menschen lebst, wirst du niemals reich sein.", author: "Seneca" },
    { text: "Die Seele färbt sich mit der Farbe ihrer Gedanken.", author: "Marcus Aurelius" },
    { text: "Die Zukunft ist etwas, das die meisten Menschen erst dann sehen, wenn es zu spät ist.", author: "Seneca" },
    { text: "Geduld und Zeit erreichen mehr als Stärke und Leidenschaft.", author: "Jean de La Fontaine" },
    { text: "Wir leiden öfter in der Vorstellung als in der Wirklichkeit.", author: "Seneca" },
    { text: "Der Schlüssel liegt darin, Gesellschaft mit Menschen zu halten, die dich erheben.", author: "Epiktet" },
    { text: "Das Glück deines Lebens hängt von der Beschaffenheit deiner Gedanken ab.", author: "Marcus Aurelius" },
    { text: "Wähle nicht zu leben, sondern gut zu leben.", author: "Seneca" },
    { text: "Schwierigkeiten stärken den Geist, wie Arbeit den Körper.", author: "Seneca" },
    { text: "Beginne sofort zu leben und zähle jeden separaten Tag als separates Leben.", author: "Seneca" },
    { text: "Er hat den ganzen Weg zurückgelegt, der gelernt hat, wie man zu Hause bei sich selbst ist.", author: "Michel de Montaigne" },
    { text: "Ein Edelstein kann nicht ohne Reibung poliert werden, noch ein Mann ohne Prüfungen vervollkommnet.", author: "Chinesisches Sprichwort" },
    { text: "Ein Mann, der einen Fehler gemacht hat und ihn nicht korrigiert, macht einen weiteren Fehler.", author: "Konfuzius" },
    
    // Psychology & Mindset
    { text: "Ob du denkst, du kannst es, oder du denkst, du kannst es nicht – du hast recht.", author: "Henry Ford" },
    { text: "Der Mensch ist dazu verdammt, frei zu sein.", author: "Jean-Paul Sartre" },
    { text: "In 20 Jahren wirst du mehr von den Dingen enttäuscht sein, die du nicht getan hast, als von denen, die du getan hast.", author: "Mark Twain (zugeschrieben)" },
    { text: "Der einzige Weg, großartige Arbeit zu leisten, ist, zu lieben, was man tut.", author: "Steve Jobs" },
    { text: "Definiere dich nicht durch deine Vergangenheit. Sie war nur eine Lektion, nicht eine lebenslange Strafe.", author: "Unbekannt" },
    { text: "Ein Schiff im Hafen ist sicher, aber dafür werden Schiffe nicht gebaut.", author: "John A. Shedd" },
    { text: "Der Geist ist alles. Was du denkst, das wirst du.", author: "Buddha" },
    { text: "Die beste Rache ist gewaltiger Erfolg.", author: "Frank Sinatra" },
    { text: "Harte Zeiten schaffen starke Männer. Starke Männer schaffen gute Zeiten. Gute Zeiten schaffen schwache Männer. Und schwache Männer schaffen harte Zeiten.", author: "G. Michael Hopf" },
    { text: "Der Pessimist beschwert sich über den Wind; der Optimist erwartet, dass er sich dreht; der Realist richtet die Segel aus.", author: "William Arthur Ward" },
    { text: "Disziplin ist die Brücke zwischen Zielen und deren Verwirklichung.", author: "Jim Rohn" },
    { text: "Wenn du durch die Hölle gehst, geh weiter.", author: "Winston Churchill" },
    { text: "Ein Ziel ohne Plan ist nur ein Wunsch.", author: "Antoine de Saint-Exupéry" },
    { text: "Fall siebenmal hin, steh achtmal auf.", author: "Japanisches Sprichwort" },
    { text: "Vergleiche dich nicht mit anderen. Vergleiche dich mit der Person, die du gestern warst.", author: "Unbekannt" },
    { text: "Das Geheimnis des Wandels besteht darin, all deine Energie nicht auf den Kampf gegen das Alte zu konzentrieren, sondern auf den Aufbau des Neuen.", author: "Sokrates (zugeschrieben)" },
    { text: "Du verfehlst 100% der Schüsse, die du nicht machst.", author: "Wayne Gretzky" },
    { text: "Ein ruhiges Meer hat noch keinen fähigen Seemann hervorgebracht.", author: "Franklin D. Roosevelt" },
    { text: "Die meisten Menschen überschätzen, was sie in einem Jahr tun können, und unterschätzen, was sie in zehn Jahren tun können.", author: "Bill Gates" },
    { text: "Deine Zeit ist begrenzt, also verschwende sie nicht damit, das Leben eines anderen zu leben.", author: "Steve Jobs" },
];


/**
 * Main function to run the simulation and render all outputs.
 */
function updateSimulation(noAnimation = false) {
    const { 
        initialCapital,
        monthlyInvestment,
        contributionPeriod,
        simulationPeriod,
        withdrawalAmount,
        withdrawalStartYear,
        selectedReturns,
        useAge,
        currentAge,
    } = state;

    if (selectedReturns.length === 0) {
        clearOutput();
        return;
    }

    const labels = useAge && currentAge && currentAge > 0
        ? [`Alter ${currentAge}`, ...Array.from({ length: simulationPeriod }, (_, i) => `Alter ${currentAge + i + 1}`)]
        : ['Start', ...Array.from({ length: simulationPeriod }, (_, i) => `Jahr ${i + 1}`)];
        
    const cumulativeInvestmentData = [initialCapital, ...Array.from({ length: simulationPeriod }, (_, i) => {
        const yearsOfContribution = Math.min(i + 1, contributionPeriod);
        return initialCapital + yearsOfContribution * monthlyInvestment * 12;
    })];

    const simulationData = new Map<number, ScenarioData>();

    selectedReturns.forEach(annualReturnPercent => {
        const annualReturn = annualReturnPercent / 100;
        const portfolioData = [initialCapital];
        const btcPriceData = [INITIAL_BTC_PRICE];
        const yearlyWithdrawals = [0]; // Year 0 has no withdrawal
        let currentPortfolioValue = initialCapital;
        let currentBtcPrice = INITIAL_BTC_PRICE;

        for (let year = 1; year <= simulationPeriod; year++) {
            // 1. Add contributions if within the contribution period
            if (year <= contributionPeriod) {
                currentPortfolioValue += (monthlyInvestment * 12);
            }
            
            // 2. Apply growth
            currentPortfolioValue *= (1 + annualReturn);

            // 3. Subtract withdrawals if in withdrawal phase
            let actualWithdrawalThisYear = 0;
            if (withdrawalStartYear > 0 && year >= withdrawalStartYear && currentPortfolioValue > 0) {
                const plannedAnnualWithdrawal = withdrawalAmount * 12;
                actualWithdrawalThisYear = Math.min(currentPortfolioValue, plannedAnnualWithdrawal);
                currentPortfolioValue -= actualWithdrawalThisYear;
            }
            
            portfolioData.push(currentPortfolioValue);
            yearlyWithdrawals.push(actualWithdrawalThisYear);

            // BTC price simulation
            currentBtcPrice *= (1 + annualReturn);
            btcPriceData.push(currentBtcPrice);
        }
        simulationData.set(annualReturnPercent, { portfolio: portfolioData, btcPrice: btcPriceData, withdrawals: yearlyWithdrawals });
    });
    
    renderOutput(labels, cumulativeInvestmentData, simulationData, noAnimation);
}

/**
 * Renders the output sections (table and chart).
 */
function renderOutput(labels: string[], cumulativeInvestmentData: number[], simulationData: Map<number, ScenarioData>, noAnimation = false) {
    chartContainerWrapper.classList.remove('hidden');
    tableContainerWrapper.classList.remove('hidden');
    summaryCard.classList.remove('hidden');
    
    if (tableTitle) {
        tableTitle.textContent = state.isBitcoinContext ? 'Wertentwicklung pro Jahr' : 'Depotentwicklung pro Jahr';
    }
    
    const sortedReturns = [...simulationData.keys()].sort((a,b) => a - b);
    const yearHeader = state.useAge && state.currentAge && state.currentAge > 0 ? 'Alter' : 'Jahr';

    const btcPriceHeaders = state.isBitcoinContext 
        ? sortedReturns.map(r => `<th>BTC Preis (${r}%)</th>`).join('') 
        : '';

    const headerRow = `
        <th>${yearHeader}</th>
        <th>Investiert (kum.)</th>
        ${sortedReturns.map(r => `<th>Depotwert (${r}%)</th>`).join('')}
        ${btcPriceHeaders}
    `;

    const bodyRows = Array.from({ length: state.simulationPeriod + 1 }, (_, i) => {
        const yearIndex = i;
        const yearLabel = state.useAge && state.currentAge && state.currentAge > 0
            ? (i === 0 ? `${state.currentAge}` : `${state.currentAge + i}`)
            : (i === 0 ? 'Start' : `Jahr ${i}`);
        const invested = cumulativeInvestmentData[yearIndex];
        
        const portfolioCells = sortedReturns.map(r => {
            const data = simulationData.get(r);
            const portfolioValue = data ? formatCurrency(data.portfolio[yearIndex]) : 'N/A';
            return `<td>${portfolioValue}</td>`;
        }).join('');

        const btcPriceCells = state.isBitcoinContext ? sortedReturns.map(r => {
            const data = simulationData.get(r);
            const btcPriceValue = data ? formatCurrency(data.btcPrice[yearIndex]) : 'N/A';
            return `<td>${btcPriceValue}</td>`;
        }).join('') : '';

        return `
            <tr>
                <td>${yearLabel}</td>
                <td>${formatCurrency(invested)}</td>
                ${portfolioCells}
                ${btcPriceCells}
            </tr>
        `;
    }).join('');

    tableContainer.innerHTML = `
        <table>
            <thead>
                <tr>${headerRow}</tr>
            </thead>
            <tbody>${bodyRows}</tbody>
        </table>
    `;
    renderChart(labels, cumulativeInvestmentData, simulationData, noAnimation);
    renderSummaries(simulationData);
}

function clearOutput() {
    if (investmentChart) {
        investmentChart.destroy();
        investmentChart = null;
    }
    tableContainerWrapper.classList.add('hidden');
    chartContainerWrapper.classList.add('hidden');
    summaryCard.classList.add('hidden');
    tableContainer.innerHTML = '<p>Bitte wählen Sie eine jährliche Preissteigerung aus, um die Simulation zu starten.</p>';
}

function renderSummaries(simulationData: Map<number, ScenarioData>) {
    if (!summaryContent) return;

    let allSummariesHtml = '';
    const sortedReturns = [...simulationData.keys()].sort((a,b) => a - b);

    if (sortedReturns.length === 0) {
        summaryContent.innerHTML = '';
        summaryCard.classList.add('hidden');
        return;
    }

    summaryCard.classList.remove('hidden');

    for (const returnValue of sortedReturns) {
        const data = simulationData.get(returnValue);
        if (!data) continue;

        const { portfolio, withdrawals } = data;
        const { initialCapital, monthlyInvestment, contributionPeriod, simulationPeriod, withdrawalStartYear, withdrawalAmount, useAge, currentAge } = state;

        const totalInvestedYears = Math.min(contributionPeriod, simulationPeriod);
        const totalInvested = initialCapital + (monthlyInvestment * 12 * totalInvestedYears);
        
        const totalWithdrawn = withdrawals.reduce((sum, w) => sum + w, 0);

        const finalPortfolioValue = portfolio[portfolio.length - 1];
        const profit = finalPortfolioValue + totalWithdrawn - totalInvested;
        
        let depletionYear = -1;
        if (withdrawalStartYear > 0 && withdrawalAmount > 0) {
            for (let i = withdrawalStartYear; i < portfolio.length; i++) {
                if (portfolio[i] <= 0 && withdrawals[i] > 0) {
                     depletionYear = i;
                     break;
                }
            }
        }

        let withdrawalPeriodText = '–';
        if (withdrawalStartYear > 0 && withdrawalAmount > 0) {
            const startYear = withdrawalStartYear;
            const endYearText = depletionYear !== -1 ? `${depletionYear}` : '∞';
            const endAgeText = depletionYear !== -1 ? `${currentAge! + depletionYear}` : '∞';
            
            if (totalWithdrawn > 0) {
                 if (useAge && currentAge) {
                    withdrawalPeriodText = `Alter ${currentAge + startYear} - ${endAgeText}`;
                } else {
                    withdrawalPeriodText = `Jahr ${startYear} - ${endYearText}`;
                }
            } else {
                withdrawalPeriodText = 'Keine Auszahlung möglich';
            }
        }

        const profitClass = profit >= 0 ? 'positive' : 'negative';
        const color = getColorForReturn(returnValue);

        allSummariesHtml += `
            <div class="scenario-summary" style="border-left-color: ${color.border};">
                <h3 class="scenario-title">${returnValue}% Rendite Szenario</h3>
                <div class="summary-grid">
                    <div>
                        <span class="summary-label">Gesamt eingezahlt</span>
                        <span class="summary-value">${formatCurrency(totalInvested)}</span>
                    </div>
                    <div>
                        <span class="summary-label">Gesamt ausgezahlt</span>
                        <span class="summary-value">${formatCurrency(totalWithdrawn)}</span>
                    </div>
                     <div>
                        <span class="summary-label">Gewinn</span>
                        <span class="summary-value ${profitClass}">${formatCurrency(profit)}</span>
                    </div>
                    <div>
                        <span class="summary-label">Auszahlungszeitraum</span>
                        <span class="summary-value">${withdrawalPeriodText}</span>
                    </div>
                </div>
            </div>
        `;
    }
    summaryContent.innerHTML = allSummariesHtml;
}


/**
 * Renders the investment growth chart.
 */
function renderChart(labels: string[], cumulativeInvestmentData: number[], simulationData: Map<number, ScenarioData>, noAnimation = false) {
    const ctx = (document.getElementById('investment-chart') as HTMLCanvasElement)?.getContext('2d');
    if (!ctx) return;

    if (investmentChart) {
        investmentChart.destroy();
    }
    
    const sortedReturns = [...simulationData.keys()].sort((a, b) => a - b);
    const animationDuration = noAnimation ? 0 : 800;

    const datasets: ChartDataset[] = sortedReturns.map(returnValue => {
        const data = simulationData.get(returnValue)!;
        const color = getColorForReturn(returnValue);
        
        return {
            label: `Depotwert bei ${returnValue}%`,
            data: data.portfolio,
            borderColor: color.border,
            backgroundColor: color.bg,
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: color.border,
            order: 1
        };
    });

    datasets.push({
        label: 'Investiert (kum.)',
        data: cumulativeInvestmentData,
        borderColor: '#718096',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        fill: false,
        tension: 0.1,
        pointRadius: 0,
        order: 2
    });

    investmentChart = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: animationDuration, easing: 'easeOutCubic' },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: (v) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', notation: 'compact' }).format(Number(v)) }
                },
                x: { grid: { display: false } }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            return `${context.dataset.label || ''}: ${formatCurrency(context.parsed.y)}`;
                        }
                    }
                },
                legend: {
                    position: 'bottom',
                    labels: { 
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'line',
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index',
            },
        }
    });
}

/**
 * Manages the quote display and rotation.
 */
function showNextQuote() {
    if (quoteInterval) {
        clearInterval(quoteInterval);
    }
    const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    if(quoteTextElement) quoteTextElement.textContent = `“${quote.text}”`;
    if(quoteAuthorElement) quoteAuthorElement.textContent = `– ${quote.author}`;
    
    quoteInterval = setInterval(showNextQuote, 30000); // Rotate every 30 seconds
}

/**
 * Gets a color from the predefined palette for a given return value.
 */
function getColorForReturn(returnValue: number) {
    const customReturnInput = document.getElementById('custom-return-rate') as HTMLInputElement;
    const customReturnValue = customReturnInput && customReturnInput.value ? parseFloat(customReturnInput.value) : NaN;

    if (returnValue === customReturnValue) {
        return CUSTOM_RETURN_COLOR;
    }

    const predefinedIndex = PREDEFINED_RETURNS.indexOf(returnValue);
    if (predefinedIndex !== -1) {
        return DATASET_COLORS[predefinedIndex];
    }
    
    // Fallback for any other values
    const hash = String(returnValue).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return DATASET_COLORS[hash % (DATASET_COLORS.length -1)]; // Exclude custom color from hash
}

function updateAllVisualStyles() {
    updateToggleStyles();
    updateCustomInputStyles();
    updateWithdrawalGroupState();
    updateAgeInputGroupState();
}

/**
 * Updates the styles of the return rate toggles based on selection.
 */
function updateToggleStyles() {
    const returnCheckboxes = document.querySelectorAll('#return-rate-group input[type="checkbox"]');
    returnCheckboxes.forEach(checkbox => {
        const input = checkbox as HTMLInputElement;
        const label = document.querySelector(`label[for="${input.id}"]`) as HTMLLabelElement;
        if (!label) return;

        label.style.removeProperty('--toggle-active-bg');
        label.style.removeProperty('--toggle-active-border');
        label.style.removeProperty('--toggle-active-text');

        if (input.checked) {
            const value = parseFloat(input.value);

            if (!isNaN(value)) {
                const color = getColorForReturn(value);
                label.style.setProperty('--toggle-active-bg', color.bg);
                label.style.setProperty('--toggle-active-border', color.border);
                label.style.setProperty('--toggle-active-text', color.border);
            }
        }
    });
}

function updateCustomInputStyles() {
    document.querySelectorAll('.custom-toggle-input').forEach(inputEl => {
        const input = inputEl as HTMLInputElement;
        const wrapper = input.closest<HTMLElement>('.custom-input-wrapper');
        if (!wrapper) return;
        
        const hasValue = !!input.value;
        wrapper.classList.toggle('active', hasValue);
        wrapper.classList.toggle('has-value', hasValue);

        // For return rate, apply color
        if (input.id === 'custom-return-rate' && hasValue) {
            const value = parseFloat(input.value);
            if (!isNaN(value)) {
                const color = getColorForReturn(value);
                wrapper.style.setProperty('--toggle-active-bg', color.bg);
                wrapper.style.setProperty('--toggle-active-border', color.border);
                wrapper.style.setProperty('--toggle-active-text', color.border);
            }
        } else {
            wrapper.style.removeProperty('--toggle-active-bg');
            wrapper.style.removeProperty('--toggle-active-border');
            wrapper.style.removeProperty('--toggle-active-text');
        }
    });
}


/**
 * Formats a number as German currency.
 */
function formatCurrency(value: number): string {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
}

function updateWithdrawalGroupState() {
    const withdrawalAmountGroup = document.getElementById('withdrawal-amount-control-group');
    if (withdrawalAmountGroup) {
        const isDisabled = state.withdrawalStartYear === 0;
        withdrawalAmountGroup.classList.toggle('disabled-group', isDisabled);
    }
}

function updateAgeInputGroupState() {
    const useAgeToggle = document.getElementById('use-age-toggle') as HTMLInputElement;
    const ageInputGroup = document.getElementById('age-input-group');
    const ageInput = document.getElementById('current-age-input') as HTMLInputElement;
    if (ageInputGroup && ageInput) {
        const isDisabled = !useAgeToggle.checked;
        ageInputGroup.classList.toggle('disabled-group', isDisabled);
        ageInput.disabled = isDisabled;
    }
}

// --- Event Handling ---
function updateStateAndRunSimulation(event?: Event) {
    const target = event?.target as HTMLElement;
    const isAgeUpdate = target && (target.id === 'current-age-input' || target.id === 'use-age-toggle');
    const isBtcToggleUpdate = target && target.id === 'bitcoin-toggle';

    // --- Current Age ---
    const useAgeToggle = document.getElementById('use-age-toggle') as HTMLInputElement;
    state.useAge = useAgeToggle.checked;
    const ageInput = document.getElementById('current-age-input') as HTMLInputElement;
    state.currentAge = state.useAge && ageInput.value ? parseInt(ageInput.value, 10) : null;
    
    // --- Bitcoin Context Toggle ---
    const btcToggle = document.getElementById('bitcoin-toggle') as HTMLInputElement;
    state.isBitcoinContext = btcToggle.checked;
    if (mainTitle) {
      mainTitle.textContent = state.isBitcoinContext ? 'Bitcoin Simulator' : 'Zinseszins Simulator';
    }


    // --- Helper function for radio/custom groups ---
    const getRadioOrCustomValue = (groupName: string, customInputId: string): number => {
        const customInput = document.getElementById(customInputId) as HTMLInputElement;
        if (customInput && customInput.value) {
            return parseFloat(customInput.value) || 0;
        }
        const radio = document.querySelector(`input[name="${groupName}"]:checked`) as HTMLInputElement;
        return radio ? parseFloat(radio.value) : 0;
    };
    
    // --- Update state using the helper ---
    state.initialCapital = getRadioOrCustomValue('startCapital', 'custom-start-capital');
    state.monthlyInvestment = getRadioOrCustomValue('monthlyRate', 'custom-monthly-rate');
    state.contributionPeriod = getRadioOrCustomValue('contributionPeriod', 'custom-contribution-period');
    state.simulationPeriod = getRadioOrCustomValue('simulationPeriod', 'custom-simulation-period');
    state.withdrawalStartYear = getRadioOrCustomValue('withdrawalStart', 'custom-withdrawal-start');
    state.withdrawalAmount = getRadioOrCustomValue('withdrawalAmount', 'custom-withdrawal-amount');
    
    // --- Update Selected Returns (checkboxes + custom) ---
    const returnCheckboxes = document.querySelectorAll('#return-rate-group input[type="checkbox"]:checked');
    state.selectedReturns = [];
    returnCheckboxes.forEach(checkbox => {
        state.selectedReturns.push(parseFloat((checkbox as HTMLInputElement).value));
    });
    const customReturnInput = document.getElementById('custom-return-rate') as HTMLInputElement;
    if (customReturnInput && customReturnInput.value) {
        const customValue = parseFloat(customReturnInput.value);
        if (!isNaN(customValue)) {
            state.selectedReturns.push(customValue);
        }
    }
    state.selectedReturns = [...new Set(state.selectedReturns)];


    updateAllVisualStyles();
    updateSimulation(isAgeUpdate || isBtcToggleUpdate);
}


// --- Initializing the App ---
document.addEventListener('DOMContentLoaded', () => {
    // Sync logic for custom inputs and radio buttons
    document.querySelectorAll('.custom-toggle-input').forEach(input => {
        const customInput = input as HTMLInputElement;
        const groupName = customInput.dataset.group;
        if (groupName) { // This input is part of a radio group
            const handleFocusOrInput = () => {
                const radios = document.querySelectorAll(`input[name="${groupName}"]`) as NodeListOf<HTMLInputElement>;
                radios.forEach(radio => radio.checked = false);
            };
            customInput.addEventListener('input', handleFocusOrInput);
            customInput.addEventListener('focus', handleFocusOrInput);
        }
    });

    const radioGroups = new Set([...document.querySelectorAll<HTMLInputElement>('input[type="radio"]')].map(r => r.name));
    radioGroups.forEach(name => {
        if (!name) return;
        const radios = document.querySelectorAll(`input[name="${name}"]`);
        const customInput = document.querySelector(`.custom-toggle-input[data-group="${name}"]`) as HTMLInputElement | null;
        if (customInput) {
            radios.forEach(radio => {
                radio.addEventListener('change', () => {
                    customInput.value = '';
                    // Manually trigger style update for custom input
                    updateCustomInputStyles();
                });
            });
        }
    });

    // Event handlers for custom input controls (steppers, clear)
    controlsContainer.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        const wrapper = target.closest('.custom-input-wrapper');
        if (!wrapper) return;
        
        const input = wrapper.querySelector('.custom-toggle-input') as HTMLInputElement;

        if (target.matches('.clear-btn')) {
            input.value = '';
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }

        if (target.matches('.stepper-btn')) {
            const step = parseFloat(input.step) || 1;
            const currentValue = parseFloat(input.value) || 0;
            if (target.classList.contains('up')) {
                input.value = (currentValue + step).toString();
            } else if (target.classList.contains('down')) {
                input.value = Math.max(parseFloat(input.min) || 0, currentValue - step).toString();
            }
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });


    // Main event listener for any change in the controls
    controlsContainer.addEventListener('change', updateStateAndRunSimulation);
    
    // Listen for events on custom inputs that don't trigger 'change' (e.g., typing)
    controlsContainer.addEventListener('input', (event) => {
        const target = event.target as HTMLInputElement;
        if (target.matches('.custom-toggle-input, #current-age-input')) {
            updateStateAndRunSimulation(event);
        }
    });

    // Listener for use age toggle
    const useAgeToggle = document.getElementById('use-age-toggle');
    useAgeToggle?.addEventListener('change', (event) => {
      updateAgeInputGroupState();
      updateStateAndRunSimulation(event);
    });

    quoteContainer?.addEventListener('click', showNextQuote);

    showNextQuote(); // Initial quote and start timer
    updateStateAndRunSimulation(); // Initial simulation run
    updateAllVisualStyles(); // Set initial styles
});