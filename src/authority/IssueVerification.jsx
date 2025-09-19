import React, { useEffect, useState } from 'react';
import styles from './IssueVerification.module.css';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function IssueVerification() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();

    const [issue, setIssue] = useState(null);
    const [departments, setDepartments] = useState([]);
    const [selectedDept, setSelectedDept] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [aiResult, setAiResult] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);

    useEffect(() => {
        const base = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const run = async () => {
            try {
                const [{ data: issueData }, { data: meta }] = await Promise.all([
                    axios.get(`${base}/api/issues/${id}`),
                    axios.get(`${base}/api/issues/meta/departments`),
                ]);
                setIssue(issueData);
                setDepartments(meta.departments || []);
                // trigger AI validation after we have the issue
                try {
                    setAiLoading(true);
                    const { data: ai } = await axios.post(`${base}/api/issues/${id}/validate-ai`);
                    setAiResult(ai);
                } catch (ae) {
                    console.warn('AI validation failed', ae);
                    setAiResult({ error: ae.response?.data?.message || ae.message });
                } finally {
                    setAiLoading(false);
                }
            } catch (e) {
                setError(e.response?.data?.message || 'Failed to load issue');
            } finally {
                setLoading(false);
            }
        };
        run();
    }, [id]);

    const verify = async (action) => {
        try {
            const base = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const { data } = await axios.post(`${base}/api/issues/${id}/verify`, {
                action,
                department: selectedDept || null,
            });
            navigate('/govt-problem-page');
        } catch (e) {
            alert(e.response?.data?.message || 'Failed to update issue');
        }
    };

    if (!isAuthenticated || (user && !['govt_authority', 'admin'].includes(user.role))) {
        return (
            <div className={styles.container}>
                <div className={styles.header}><div className={styles.title}>Access Denied</div></div>
                <p>You must be a government authority or admin to verify issues.</p>
            </div>
        );
    }

    if (loading) return <div className={styles.container}><div>Loading...</div></div>;
    if (error) return <div className={styles.container}><div style={{ color: 'red' }}>{error}</div></div>;
    if (!issue) return <div className={styles.container}><div>Issue not found</div></div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.title}>Pending Verification</div>
                <div className={styles.actions}>
                    <button className={`${styles.btn} ${styles.btnApprove}`} onClick={() => verify('approve')}>Approve</button>
                    <button className={`${styles.btn} ${styles.btnDeny}`} onClick={() => verify('deny')}>Deny</button>
                </div>
            </div>

            {/* AI suggestion box */}
            <div className={styles.aiBox}>
                {aiLoading && <div>Analyzing with AI...</div>}
                {!aiLoading && aiResult && aiResult.error && (
                    <div style={{ color: 'red' }}>AI error: {aiResult.error}</div>
                )}
                {!aiLoading && aiResult && !aiResult.error && (
                    <div>
                        <div><b>Validation:</b> {aiResult.validated === 'validated' ? 'Validated' : (aiResult.validated === 'not_validated' ? 'Not validated' : 'Unknown')}</div>
                        <div><b>Confidence:</b> {typeof aiResult.confidence === 'number' ? Math.round(aiResult.confidence * 100) + '%' : 'N/A'}</div>
                        <div style={{ marginTop: 6 }}><b>Suggested Departments:</b> {aiResult.suggestions && aiResult.suggestions.length ? aiResult.suggestions.join(', ') : 'None'}</div>
                        <div style={{ marginTop: 6 }}><b>Explanation:</b><div>{aiResult.explanation || 'No explanation provided'}</div></div>
                    </div>
                )}
                {!aiLoading && !aiResult && (
                    <div>AI suggestion not available</div>
                )}
            </div>

            <div className={styles.panels}>
                <div className={styles.panel}>
                    <div className={styles.panelTitle}>All Departments</div>
                    <div className={styles.list}>
                        {departments.map(d => (
                            <label key={d} className={styles.radioRow}>
                                <input type="radio" name="dept" value={d} checked={selectedDept === d} onChange={(e) => setSelectedDept(e.target.value)} />
                                <span style={{ textTransform: 'capitalize' }}>{d}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className={styles.panel}>
                    <div className={styles.panelTitle}>Issue Details</div>
                    <div>
                        <div className={styles.metaRow}><span><b>Phone:</b> {issue.phone_number || 'N/A'}</span> <span><b>Status:</b> {issue.status}</span></div>
                        <div className={styles.metaRow}><span><b>Lat:</b> {issue.latitude ?? 'N/A'}</span> <span><b>Lon:</b> {issue.longitude ?? 'N/A'}</span></div>
                        <div style={{ marginTop: 8 }}><b>Description:</b><br />{issue.description || 'No description'}</div>
                        {issue.photo && <img className={styles.image} src={issue.photo} alt="evidence" />}
                    </div>
                </div>
            </div>
        </div>
    );
}
