interface Skill {
    name: string;
    score: number;
    feedback: string;
}

interface TranscriptMessage {
    id: string | number;
    speaker: string;
    sender?: string; // Legacy support
    text: string;
    timestamp?: string;
}

interface ReportData {
    candidateName: string;
    position: string;
    overallScore: number;
    date: string;
    executiveSummary: string;
    strengths: string[];
    improvements: string[];
    overallSkills: Skill[];
    technicalSkills: Skill[];
    actionPlan: string[];
    transcript: TranscriptMessage[];
}

export function generateReportHTML(reportData: ReportData): string {
    const primaryColor = "#A855F7";
    const bgDark = "#020617";
    const bgCard = "rgba(30, 41, 59, 0.4)";
    const borderColor = "rgba(255, 255, 255, 0.05)";
    const textMuted = "rgba(255, 255, 255, 0.4)";

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Intelligence Profile - ${reportData.candidateName}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Inter', -apple-system, sans-serif;
            background-color: ${bgDark};
            color: #ffffff;
            line-height: 1.5;
            padding: 40px 20px;
            background-image: 
                radial-gradient(circle at 0% 0%, rgba(168, 85, 247, 0.05) 0%, transparent 50%),
                radial-gradient(circle at 100% 100%, rgba(168, 85, 247, 0.05) 0%, transparent 50%);
        }

        .container {
            max-width: 1000px;
            margin: 0 auto;
        }

        /* Tactical Header */
        .header {
            margin-bottom: 32px;
            position: relative;
        }

        .badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 6px 16px;
            background: rgba(168, 85, 247, 0.1);
            border: 1px solid rgba(168, 85, 247, 0.2);
            border-radius: 9999px;
            color: ${primaryColor};
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            margin-bottom: 16px;
        }

        .title-section h1 {
            font-size: 42px;
            font-weight: 900;
            letter-spacing: -0.02em;
            line-height: 1;
            margin-bottom: 8px;
        }

        .title-section h1 span {
            color: ${primaryColor};
            font-style: italic;
        }

        .subtitle {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-top: 12px;
        }

        .role-badge {
            background: ${bgCard};
            backdrop-filter: blur(20px);
            border: 1px solid ${borderColor};
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: ${primaryColor};
        }

        .type-badge {
            display: flex;
            align-items: center;
            gap: 6px;
            color: ${textMuted};
            font-size: 9px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.1em;
        }

        .dot {
            width: 6px;
            height: 6px;
            background: #f59e0b;
            border-radius: 50%;
            box-shadow: 0 0 8px rgba(245, 158, 11, 0.4);
        }

        /* Grid Layout */
        .intelligence-grid {
            display: grid;
            grid-template-columns: 280px 1fr;
            gap: 24px;
            margin-bottom: 32px;
        }

        .card {
            background: ${bgCard};
            backdrop-filter: blur(40px);
            border: 1px solid ${borderColor};
            border-radius: 24px;
            padding: 32px;
            position: relative;
            overflow: hidden;
        }

        /* Score Gauge */
        .score-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
        }

        .gauge-container {
            position: relative;
            width: 160px;
            height: 160px;
            margin-bottom: 24px;
        }

        .gauge-svg {
            transform: rotate(-90deg);
        }

        .gauge-bg {
            fill: none;
            stroke: rgba(255, 255, 255, 0.05);
            stroke-width: 8;
        }

        .gauge-fill {
            fill: none;
            stroke: ${primaryColor};
            stroke-width: 8;
            stroke-linecap: round;
            stroke-dasharray: 440;
            stroke-dashoffset: ${440 - (440 * reportData.overallScore) / 100};
            transition: stroke-dashoffset 1s ease-out;
        }

        .score-value {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .score-num {
            font-size: 48px;
            font-weight: 900;
            line-height: 1;
        }

        .score-label {
            font-size: 8px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            color: ${textMuted};
            margin-top: 4px;
        }

        .status-pill {
            padding: 8px 16px;
            border-radius: 12px;
            font-size: 9px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.2);
            color: #10b981;
        }

        .status-pill.needs-opt {
            background: rgba(244, 63, 94, 0.1);
            border: 1px solid rgba(244, 63, 94, 0.2);
            color: #f43f5e;
        }

        /* Executive Summary */
        .summary-card h2 {
            font-size: 20px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 4px;
        }

        .section-tag {
            font-size: 9px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.3em;
            color: ${primaryColor};
            margin-bottom: 24px;
        }

        .summary-text {
            font-size: 16px;
            font-weight: 500;
            line-height: 1.6;
            color: rgba(255, 255, 255, 0.8);
            border-left: 3px solid rgba(168, 85, 247, 0.3);
            padding-left: 20px;
            margin-bottom: 32px;
            font-style: italic;
        }

        .metadata-row {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            padding-top: 24px;
            border-top: 1px solid ${borderColor};
        }

        .meta-item {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .meta-icon {
            width: 32px;
            height: 32px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
        }

        .meta-content {
            display: flex;
            flex-direction: column;
        }

        .meta-label {
            font-size: 8px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: ${textMuted};
        }

        .meta-value {
            font-size: 11px;
            font-weight: 900;
            text-transform: uppercase;
        }

        /* Sections */
        .detail-sections {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            margin-bottom: 24px;
        }

        .section-title {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 24px;
            font-size: 18px;
            font-weight: 900;
            text-transform: uppercase;
        }

        .title-icon {
            width: 36px;
            height: 36px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .points-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .point-item {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid ${borderColor};
            padding: 16px;
            border-radius: 16px;
            display: flex;
            gap: 12px;
            font-size: 12px;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.8);
        }

        .point-marker {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            flex-shrink: 0;
            margin-top: 2px;
        }

        /* Competencies */
        .competencies-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-top: 24px;
        }

        .skill-card {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid ${borderColor};
            padding: 24px;
            border-radius: 20px;
        }

        .skill-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 16px;
        }

        .skill-name-wrap h4 {
            font-size: 14px;
            font-weight: 900;
            text-transform: uppercase;
            margin-bottom: 2px;
        }

        .skill-tag {
            font-size: 7px;
            font-weight: 900;
            text-transform: uppercase;
            color: ${primaryColor};
            letter-spacing: 0.1em;
        }

        .skill-score-num {
            font-size: 20px;
            font-weight: 900;
            color: ${primaryColor};
        }

        .progress-bg {
            height: 6px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 3px;
            margin-bottom: 12px;
            overflow: hidden;
        }

        .progress-bar {
            height: 100%;
            background: ${primaryColor};
            border-radius: 3px;
            box-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
        }

        .skill-brief {
            font-size: 11px;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.6);
            line-height: 1.5;
        }

        /* Transcript */
        .transcript-wrap {
            margin-top: 32px;
        }

        .message-row {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 20px;
            max-width: 85%;
        }

        .message-row.user {
            margin-left: auto;
            align-items: flex-end;
        }

        .sender-info {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 0 8px;
        }

        .sender-tag {
            font-size: 7px;
            font-weight: 900;
            padding: 2px 6px;
            border-radius: 4px;
            text-transform: uppercase;
        }

        .timestamp {
            font-size: 8px;
            font-weight: 900;
            color: ${textMuted};
        }

        .bubble {
            padding: 16px;
            border-radius: 16px;
            font-size: 13px;
            font-weight: 600;
            line-height: 1.5;
        }

        .ai .bubble {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid ${borderColor};
            border-top-left-radius: 0;
        }

        .user .bubble {
            background: ${primaryColor};
            color: #000000;
            border-top-right-radius: 0;
        }

        .report-id-footer {
            margin-top: 48px;
            padding-top: 24px;
            border-top: 1px solid ${borderColor};
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: ${textMuted};
            font-size: 9px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.1em;
        }

        .arjuna-logo-small {
            font-size: 14px;
            font-weight: 900;
            color: #ffffff;
        }

        @media print {
            body { background: #020617 !important; -webkit-print-color-adjust: exact; }
            .card { background: rgba(30, 41, 59, 1) !important; backdrop-filter: none !important; }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Tactical Header -->
        <header class="header">
            <div class="badge">
                <span>🏹</span> Intelligence Profile
            </div>
            <div class="title-section">
                <h1>${reportData.candidateName} <span>Analytics</span></h1>
                <div class="subtitle">
                    <div class="role-badge">${reportData.position}</div>
                    <div class="type-badge">
                        <div class="dot"></div>
                        Tactical Protocol
                    </div>
                </div>
            </div>
        </header>

        <!-- Primary Intelligence -->
        <div class="intelligence-grid">
            <div class="card score-card">
                <div class="gauge-container">
                    <svg class="gauge-svg" width="160" height="160">
                        <circle class="gauge-bg" cx="80" cy="80" r="70" />
                        <circle class="gauge-fill" cx="80" cy="80" r="70" />
                    </svg>
                    <div class="score-value">
                        <span class="score-num">${reportData.overallScore}</span>
                        <span class="score-label">Analytical Grade</span>
                    </div>
                </div>
                <div class="status-pill ${reportData.overallScore >= 70 ? '' : 'needs-opt'}">
                    ${reportData.overallScore >= 70 ? 'Primary Deployment' : 'Tactical Recalibration'}
                </div>
                <div style="font-size: 8px; font-weight: 900; text-transform: uppercase; color: ${textMuted}; margin-top: 12px;">
                    Status: <span style="color: rgba(255,255,255,0.6)">${reportData.overallScore >= 70 ? 'Validated' : 'Needs Optimization'}</span>
                </div>
            </div>

            <div class="card summary-card">
                <div class="section-tag">Protocol Intelligence Summary</div>
                <h2>Executive Overview</h2>
                <div class="summary-text">
                    "${reportData.executiveSummary}"
                </div>
                
                <div class="metadata-row">
                    <div class="meta-item">
                        <div class="meta-icon">⏳</div>
                        <div class="meta-content">
                            <span class="meta-label">Temporal Log</span>
                            <span class="meta-value">${reportData.date.split(',')[0]}</span>
                        </div>
                    </div>
                    <div class="meta-item">
                        <div class="meta-icon">🎯</div>
                        <div class="meta-content">
                            <span class="meta-label">Competencies</span>
                            <span class="meta-value">${reportData.overallSkills.length} Total</span>
                        </div>
                    </div>
                    <div class="meta-item">
                        <div class="meta-icon">💬</div>
                        <div class="meta-content">
                            <span class="meta-label">Transmissions</span>
                            <span class="meta-value">${reportData.transcript.length} Segments</span>
                        </div>
                    </div>
                    <div class="meta-item">
                        <div class="meta-icon">🏆</div>
                        <div class="meta-content">
                            <span class="meta-label">Rank Grade</span>
                            <span class="meta-value">${reportData.overallScore >= 90 ? 'A+' : reportData.overallScore >= 80 ? 'A' : reportData.overallScore >= 70 ? 'B+' : 'C'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tactical Analysis -->
        <div class="detail-sections">
            <div class="card">
                <h3 class="section-title" style="color: #10b981;">
                    <div class="title-icon" style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2);">🛡️</div>
                    Tactical Strengths
                </h3>
                <div class="points-list">
                    ${reportData.strengths.map(s => `
                        <div class="point-item">
                            <div class="point-marker" style="background: rgba(16, 185, 129, 0.2); color: #10b981;">✓</div>
                            ${s}
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="card">
                <h3 class="section-title" style="color: #f43f5e;">
                    <div class="title-icon" style="background: rgba(244, 63, 94, 0.1); border: 1px solid rgba(244, 63, 94, 0.2);">⚡</div>
                    Growth Directives
                </h3>
                <div class="points-list">
                    ${reportData.improvements.map(s => `
                        <div class="point-item">
                            <div class="point-marker" style="background: rgba(244, 63, 94, 0.2); color: #f43f5e;">!</div>
                            ${s}
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>

        <!-- Competencies -->
        <div class="card">
            <div class="section-tag">Vector Positioning</div>
            <h3 class="section-title">Core Competencies</h3>
            <div class="competencies-grid">
                ${reportData.overallSkills.map(skill => `
                    <div class="skill-card">
                        <div class="skill-top">
                            <div class="skill-name-wrap">
                                <h4>${skill.name}</h4>
                                <span class="skill-tag">Intelligence Metric</span>
                            </div>
                            <div class="skill-score-num">${skill.score}%</div>
                        </div>
                        <div class="progress-bg">
                            <div class="progress-bar" style="width: ${skill.score}%"></div>
                        </div>
                        <p class="skill-brief">${skill.feedback}</p>
                    </div>
                `).join('')}
            </div>
        </div>

        <!-- Transcript -->
        <div class="card transcript-wrap">
            <div class="section-tag">Session Protocol Log</div>
            <h3 class="section-title">Intelligence Transcript</h3>
            <div style="margin-top: 32px;">
                ${reportData.transcript.slice(0, 15).map(msg => {
        const speakerRaw = (msg.speaker || msg.sender || '').toLowerCase();
        const isAI = ['ai', 'agent', 'model'].includes(speakerRaw);
        return `
                        <div class="message-row ${isAI ? 'ai' : 'user'}">
                            <div class="sender-info">
                                <span class="sender-tag" style="background: ${isAI ? 'rgba(168, 85, 247, 0.1)' : 'rgba(255,255,255,0.05)'}; color: ${isAI ? primaryColor : textMuted};">
                                    ${isAI ? 'AI' : 'YOU'}
                                </span>
                                <span class="timestamp">${msg.timestamp || ''}</span>
                            </div>
                            <div class="bubble">${msg.text}</div>
                        </div>
                    `;
    }).join('')}
                ${reportData.transcript.length > 15 ? `
                    <div style="text-align: center; color: ${textMuted}; font-size: 10px; font-weight: 800; margin-top: 24px; text-transform: uppercase; letter-spacing: 0.2em;">
                        + ${reportData.transcript.length - 15} More Transmissions in Full Log
                    </div>
                ` : ''}
            </div>
        </div>

        <!-- Footer -->
        <footer class="report-id-footer">
            <div class="arjuna-logo-small">
                ARJUNA<span style="color: ${primaryColor}; font-style: italic;">AI</span>
                <span style="color: ${textMuted}; font-size: 8px; margin-left: 8px;">Tactical Interface v2.5</span>
            </div>
            <div>
                Intel-ID: #${Math.random().toString(36).substr(2, 9).toUpperCase()} • Generated ${new Date().toLocaleDateString()}
            </div>
        </footer>
    </div>
</body>
</html>
    `;
}

export function downloadHTMLReport(reportData: ReportData): void {
    try {
        const htmlContent = generateReportHTML(reportData);

        // Create blob and download
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Interview_Report_${reportData.candidateName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading report:', error);
        throw error;
    }
}
