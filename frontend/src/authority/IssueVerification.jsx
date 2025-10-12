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
    const [selectedDepts, setSelectedDepts] = useState([]);
    const [relatedIssues, setRelatedIssues] = useState([]);
    const [collectionHeadId, setCollectionHeadId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const base = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const run = async () => {
            try {
                const [{ data: issueData }, { data: meta }] = await Promise.all([
                    axios.get(`${base}/api/issues/${id}`),
                    axios.get(`${base}/api/issues/meta/departments`),
                ]);
                setIssue(issueData);
                setSelectedDepts(Array.isArray(issueData.assigned_departments) ? issueData.assigned_departments : []);
                setRelatedIssues(Array.isArray(issueData.related_issues) ? issueData.related_issues : []);
                setCollectionHeadId(issueData.collection_head_id || issueData.id);
                setDepartments(meta.departments || []);
            } catch (e) {
                setError(e.response?.data?.message || 'Failed to load issue');
            } finally {
                setLoading(false);
            }
        };
        run();
    }, [id]);

    const verify = async (action, idsOverride = null) => {
        try {
            const base = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const endpointId = collectionHeadId ? String(collectionHeadId) : id;
            const payload = {
                action,
                department: selectedDepts,
            };
            if (Array.isArray(idsOverride) && idsOverride.length) {
                payload.ids = idsOverride;
            }
            await axios.post(`${base}/api/issues/${endpointId}/verify`, payload);
            navigate('/govt-problem-page');
        } catch (e) {
            alert(e.response?.data?.message || 'Failed to update issue');
        }
    };

    const approveAll = () => {
        if (!issue) return;
        const groupIds = Array.from(new Set([issue.id, ...relatedIssues.map((ri) => ri.id)]));
        verify('approve', groupIds);
    };

    const denyAll = () => {
        if (!issue) return;
        const groupIds = Array.from(new Set([issue.id, ...relatedIssues.map((ri) => ri.id)]));
        verify('deny', groupIds);
    };

    const verifySingleRelated = (relatedId, action) => {
        verify(action, [relatedId]);
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
                <div className={styles.headerLeft}>
                    <button
                        type="button"
                        className={`${styles.btn} ${styles.btnBack}`}
                        onClick={() => navigate(-1)}
                    >
                        Back
                    </button>
                    <div className={styles.title}>Pending Verification</div>
                </div>
                <div className={styles.actions}>
                    <button className={`${styles.btn} ${styles.btnApprove}`} onClick={() => verify('approve', [issue.id])}>Approve</button>
                    <button className={`${styles.btn} ${styles.btnDeny}`} onClick={() => verify('deny', [issue.id])}>Deny</button>
                </div>
            </div>

            {/* AI suggestion box */}
            <div className={styles.aiBox}>
                <div><b>Photo:</b> {issue.photo ? 'Present' : 'Not provided'}</div>
                <div>
                    <b>Validation:</b>{' '}
                    {issue.photo ? (
                        issue.validation ? (
                            <span style={{ color: '#1e7c24', fontWeight: 600 }}>Validated</span>
                        ) : (
                            <span style={{ color: '#c62828', fontWeight: 600 }}>Not validated</span>
                        )
                    ) : (
                        'Cannot validate (no photo)'
                    )}
                </div>
                {issue.description_pic_ai && (
                    <div style={{ marginTop: 6 }}><b>Photo Summary:</b> {issue.description_pic_ai}</div>
                )}
                {issue.reason_text && (
                    <div style={{ marginTop: 6 }}><b>Reason:</b> {issue.reason_text}</div>
                )}
                {Array.isArray(issue.assigned_departments) && issue.assigned_departments.length > 0 && (
                    <div style={{ marginTop: 6 }}><b>Suggested Departments:</b> {issue.assigned_departments.map((dept) => dept.charAt(0).toUpperCase() + dept.slice(1)).join(', ')}</div>
                )}
                {relatedIssues.length > 0 && (
                    <div style={{ marginTop: 6 }}><b>Related Reports:</b> {relatedIssues.length}</div>
                )}
            </div>

            <div className={styles.panels}>
                <div className={styles.panel}>
                    <div className={styles.panelTitle}>All Departments</div>
                    <div className={styles.list}>
                        {departments.map(d => (
                            <label key={d} className={styles.radioRow}>
                                <input
                                    type="checkbox"
                                    name="dept"
                                    value={d}
                                    checked={selectedDepts.includes(d)}
                                    onChange={(e) => {
                                        const { checked, value } = e.target;
                                        setSelectedDepts((prev) => {
                                            if (checked) {
                                                if (prev.includes(value)) return prev;
                                                return [...prev, value];
                                            }
                                            return prev.filter((item) => item !== value);
                                        });
                                    }}
                                />
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
                        {Array.isArray(issue.assigned_departments) && issue.assigned_departments.length > 0 && (
                            <div style={{ marginTop: 8 }}><b>Current Departments:</b> {issue.assigned_departments.map((dept) => dept.charAt(0).toUpperCase() + dept.slice(1)).join(', ')}</div>
                        )}
                        {issue.photo && <img className={styles.image} src={issue.photo} alt="evidence" />}
                    </div>
                </div>
            </div>

            {relatedIssues.length > 0 && (
                <div className={styles.relatedSection}>
                    <div className={styles.relatedHeader}>
                        <div className={styles.panelTitle}>Additional Reports ({relatedIssues.length})</div>
                        <div className={styles.relatedActions}>
                            <button className={`${styles.btn} ${styles.btnApprove}`} onClick={approveAll}>Approve All</button>
                            <button className={`${styles.btn} ${styles.btnDeny}`} onClick={denyAll}>Deny All</button>
                        </div>
                    </div>
                    <div className={styles.relatedList}>
                        {relatedIssues.map((rel) => (
                            <div key={rel.id} className={styles.relatedCard}>
                                <div className={styles.relatedCardHeader}>
                                    <span><b>ID:</b> {rel.id}</span>
                                    <span><b>Status:</b> {rel.status}</span>
                                </div>
                                <div style={{ marginTop: 6 }}>
                                    <b>Description:</b>
                                    <br />
                                    {rel.description || 'No description'}
                                </div>
                                {rel.reason_text && (
                                    <div style={{ marginTop: 6 }}><b>Reason:</b> {rel.reason_text}</div>
                                )}
                                <div style={{ marginTop: 6 }}>
                                    <b>Validation:</b>{' '}
                                    {rel.validation ? (
                                        <span style={{ color: '#1e7c24', fontWeight: 600 }}>Validated</span>
                                    ) : (
                                        <span style={{ color: '#c62828', fontWeight: 600 }}>Not validated</span>
                                    )}
                                </div>
                                {Array.isArray(rel.assigned_departments) && rel.assigned_departments.length > 0 && (
                                    <div style={{ marginTop: 6 }}><b>Departments:</b> {rel.assigned_departments.map((dept) => dept.charAt(0).toUpperCase() + dept.slice(1)).join(', ')}</div>
                                )}
                                {rel.photo && (
                                    <img className={styles.image} src={rel.photo} alt={`evidence-${rel.id}`} />
                                )}
                                <div className={styles.relatedCardActions}>
                                    <button className={`${styles.btn} ${styles.btnApprove}`} onClick={() => verifySingleRelated(rel.id, 'approve')}>Approve</button>
                                    <button className={`${styles.btn} ${styles.btnDeny}`} onClick={() => verifySingleRelated(rel.id, 'deny')}>Deny</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
