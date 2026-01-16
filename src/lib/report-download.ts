interface Skill {
    name: string;
    score: number;
    feedback: string;
}

interface TranscriptMessage {
    id: string | number;
    sender: string;
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
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interview Report - ${reportData.candidateName}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', sans-serif;
            line-height: 1.6;
            color: #1e293b;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px;
        }
        h1, h2, h3, h4, h5, h6 {
            font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .container { 
            max-width: 900px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 16px; 
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        
        /* Header Section */
        .report-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            position: relative;
            overflow: hidden;
        }
        .report-header::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: pulse 15s ease-in-out infinite;
        }
        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.1); opacity: 0.8; }
        }
        .header-content { position: relative; z-index: 1; }
        .brand-section {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid rgba(255,255,255,0.2);
        }
        .brand-logo {
            font-size: 28px;
            font-weight: 800;
            letter-spacing: -0.5px;
        }
        .brand-tagline {
            font-size: 12px;
            opacity: 0.9;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .report-date {
            font-size: 13px;
            opacity: 0.9;
            text-align: right;
        }
        .candidate-info h1 {
            font-size: 36px;
            font-weight: 700;
            margin-bottom: 8px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .candidate-info .position {
            font-size: 20px;
            opacity: 0.95;
            margin-bottom: 20px;
        }
        .metadata-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        .metadata-item {
            background: rgba(255,255,255,0.15);
            padding: 12px 16px;
            border-radius: 8px;
            backdrop-filter: blur(10px);
        }
        .metadata-label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            opacity: 0.8;
            margin-bottom: 4px;
        }
        .metadata-value {
            font-size: 15px;
            font-weight: 600;
        }
        
        /* Content Section */
        .content { padding: 40px; }
        
        /* Score Section */
        .score-section { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            padding: 40px; 
            border-radius: 12px; 
            margin: 0 0 40px 0; 
            text-align: center;
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
        }
        .score-section .score { 
            font-size: 72px; 
            font-weight: 800; 
            margin-bottom: 8px;
            text-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        .score-section .label { 
            font-size: 18px; 
            opacity: 0.95;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        
        /* Section Styling */
        .section { margin: 40px 0; }
        .section h2 { 
            font-size: 26px; 
            color: #0f172a; 
            margin-bottom: 20px; 
            padding-bottom: 12px; 
            border-bottom: 3px solid #667eea;
            font-weight: 700;
        }
        .section h3 { 
            font-size: 20px; 
            color: #334155; 
            margin: 24px 0 16px;
            font-weight: 600;
        }
        
        /* Summary Box */
        .summary { 
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            padding: 24px; 
            border-radius: 12px; 
            border-left: 5px solid #667eea;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            line-height: 1.8;
        }
        
        /* Lists */
        .list { list-style: none; }
        .list li { 
            padding: 16px; 
            border-bottom: 1px solid #e2e8f0; 
            display: flex; 
            align-items: start;
            transition: background 0.2s;
        }
        .list li:hover { background: #f8fafc; }
        .list li:last-child { border-bottom: none; }
        .list li::before { 
            content: "•"; 
            color: #667eea; 
            font-weight: bold; 
            font-size: 24px; 
            margin-right: 16px;
            line-height: 1;
        }
        .strength::before { content: "✓"; color: #10b981 !important; }
        .improvement::before { content: "⚠"; color: #f59e0b !important; }
        
        /* Skill Items */
        .skill-item { 
            background: #f8fafc;
            padding: 20px; 
            border-radius: 12px; 
            margin-bottom: 20px; 
            border: 2px solid #e2e8f0;
            transition: all 0.3s;
        }
        .skill-item:hover {
            border-color: #667eea;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
        }
        .skill-header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 12px; 
        }
        .skill-name { 
            font-weight: 700; 
            color: #0f172a;
            font-size: 16px;
        }
        .skill-score { 
            font-weight: 800; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-size: 22px;
        }
        .skill-bar { 
            height: 10px; 
            background: #e2e8f0; 
            border-radius: 5px; 
            overflow: hidden; 
            margin-bottom: 12px;
        }
        .skill-bar-fill { 
            height: 100%; 
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            border-radius: 5px;
            transition: width 0.5s ease;
        }
        .skill-feedback { 
            font-size: 14px; 
            color: #64748b;
            line-height: 1.6;
        }
        
        /* Transcript */
        .transcript { 
            background: #f8fafc;
            padding: 24px; 
            border-radius: 12px; 
            max-height: 600px; 
            overflow-y: auto;
            border: 2px solid #e2e8f0;
        }
        .message { 
            margin-bottom: 20px; 
            padding: 16px; 
            border-radius: 10px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .message.ai { 
            background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
            border-left: 4px solid #667eea;
        }
        .message.user { 
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
            border-left: 4px solid #10b981;
        }
        .message-sender { 
            font-weight: 700; 
            font-size: 11px; 
            text-transform: uppercase; 
            color: #64748b; 
            margin-bottom: 8px;
            letter-spacing: 1px;
        }
        .message-text { 
            color: #1e293b;
            line-height: 1.6;
        }
        
        /* Recommendation */
        .recommendation { 
            background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
            border: 3px solid #10b981; 
            padding: 24px; 
            border-radius: 12px; 
            margin: 40px 0;
            box-shadow: 0 8px 20px rgba(16, 185, 129, 0.2);
        }
        .recommendation.negative { 
            background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
            border-color: #ef4444;
            box-shadow: 0 8px 20px rgba(239, 68, 68, 0.2);
        }
        .recommendation h3 { 
            color: #166534; 
            margin-bottom: 12px;
            font-size: 22px;
            font-weight: 700;
        }
        .recommendation.negative h3 { color: #991b1b; }
        .recommendation p {
            line-height: 1.8;
            font-size: 15px;
        }
        
        /* Footer */
        .footer { 
            margin-top: 60px; 
            padding: 30px 40px;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            text-align: center; 
            color: #64748b;
            border-top: 3px solid #667eea;
        }
        .footer-brand {
            font-size: 20px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 8px;
        }
        .footer-text {
            font-size: 13px;
            margin: 4px 0;
        }
        
        @media print {
            body { background: white; padding: 0; }
            .container { box-shadow: none; }
            .report-header::before { display: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header Section -->
        <div class="report-header">
            <div class="header-content">
                <div class="brand-section">
                    <div>
                        <div class="brand-logo">🏹 Arjuna AI</div>
                        <div class="brand-tagline">Interview Intelligence Platform</div>
                    </div>
                    <div class="report-date">
                        <div>Report Generated</div>
                        <div style="font-weight: 600;">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    </div>
                </div>
                
                <div class="candidate-info">
                    <h1>${reportData.candidateName}</h1>
                    <div class="position">${reportData.position}</div>
                    
                    <div class="metadata-grid">
                        <div class="metadata-item">
                            <div class="metadata-label">Interview Date</div>
                            <div class="metadata-value">${reportData.date}</div>
                        </div>
                        <div class="metadata-item">
                            <div class="metadata-label">Interview Type</div>
                            <div class="metadata-value">AI-Powered Assessment</div>
                        </div>
                        <div class="metadata-item">
                            <div class="metadata-label">Report ID</div>
                            <div class="metadata-value">#${Math.random().toString(36).substr(2, 9).toUpperCase()}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Content Section -->
        <div class="content">
            <div class="score-section">
                <div class="score">${reportData.overallScore}%</div>
                <div class="label">Overall Match Score</div>
            </div>

            <div class="section">
                <h2>📋 Executive Summary</h2>
                <div class="summary">${reportData.executiveSummary}</div>
            </div>

            <div class="section">
                <h2>✨ Key Strengths</h2>
                <ul class="list">
                    ${reportData.strengths.map((item: string) => `<li class="strength">${item}</li>`).join('')}
                </ul>
            </div>

            <div class="section">
                <h2>🎯 Areas for Improvement</h2>
                <ul class="list">
                    ${reportData.improvements.map((item: string) => `<li class="improvement">${item}</li>`).join('')}
                </ul>
            </div>

            <div class="section">
                <h2>📊 Overall Assessment</h2>
                ${reportData.overallSkills.map((skill: Skill) => `
                    <div class="skill-item">
                        <div class="skill-header">
                            <span class="skill-name">${skill.name}</span>
                            <span class="skill-score">${skill.score}%</span>
                        </div>
                        <div class="skill-bar">
                            <div class="skill-bar-fill" style="width: ${skill.score}%"></div>
                        </div>
                        <div class="skill-feedback">${skill.feedback}</div>
                    </div>
                `).join('')}
            </div>

            ${reportData.technicalSkills.length > 0 ? `
            <div class="section">
                <h2>💻 Technical Skills Assessment</h2>
                ${reportData.technicalSkills.map((skill: Skill) => `
                    <div class="skill-item">
                        <div class="skill-header">
                            <span class="skill-name">${skill.name}</span>
                            <span class="skill-score">${skill.score}%</span>
                        </div>
                        <div class="skill-bar">
                            <div class="skill-bar-fill" style="width: ${skill.score}%"></div>
                        </div>
                        <div class="skill-feedback">${skill.feedback}</div>
                    </div>
                `).join('')}
            </div>
            ` : ''}

            <div class="section">
                <h2>🎯 Recommended Action Plan</h2>
                <ul class="list">
                    ${reportData.actionPlan.map((item: string) => `<li>${item}</li>`).join('')}
                </ul>
            </div>

            <div class="section">
                <h2>💬 Interview Transcript</h2>
                <div class="transcript">
                    ${reportData.transcript.map((msg: TranscriptMessage) => `
                        <div class="message ${msg.sender}">
                            <div class="message-sender">${msg.sender === 'ai' ? '🤖 AI Interviewer' : '👤 Candidate'}</div>
                            <div class="message-text">${msg.text}</div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="recommendation ${reportData.overallScore >= 70 ? '' : 'negative'}">
                <h3>${reportData.overallScore >= 70 ? '✅' : '⚠️'} AI Recommendation: ${reportData.overallScore >= 70 ? 'Proceed to Next Round' : 'Additional Assessment Recommended'}</h3>
                <p>Based on the comprehensive analysis and overall match score of <strong>${reportData.overallScore}%</strong>, this candidate is ${reportData.overallScore >= 70 ? '<strong>recommended</strong> to proceed to the next stage of the interview process' : '<strong>recommended</strong> for additional assessment or skill development before proceeding'} for the <strong>${reportData.position}</strong> role.</p>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="footer-brand">🏹 Arjuna AI</div>
            <div class="footer-text">AI-Powered Interview Intelligence Platform</div>
            <div class="footer-text">© ${new Date().getFullYear()} Arjuna AI. All rights reserved.</div>
            <div class="footer-text" style="margin-top: 12px; font-size: 11px; opacity: 0.7;">
                This report was generated using advanced AI technology to provide objective candidate assessment.
            </div>
        </div>
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
