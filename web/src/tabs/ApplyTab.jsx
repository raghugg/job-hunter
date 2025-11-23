import { useState, useEffect } from "react";
import { ensureHttps } from "../utils/helpers";

export default function ApplyTab() {
  const [jobs, setJobs] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [expandedJobs, setExpandedJobs] = useState({});
  const [newJob, setNewJob] = useState({
    title: '',
    company: '',
    postUrl: '',
    description: '',
    status: 'saved',
    contacts: []
  });
  const [newContact, setNewContact] = useState({ name: '', linkedin: '', status: 'none' });

  // Load jobs from localStorage on mount
  useEffect(() => {
    try {
      const savedJobs = window.localStorage.getItem('job_applications');
      if (savedJobs) {
        setJobs(JSON.parse(savedJobs));
      }
    } catch (err) {
      console.error('Error loading jobs:', err);
    }
  }, []);

  // Save jobs to localStorage whenever they change
  useEffect(() => {
    window.localStorage.setItem('job_applications', JSON.stringify(jobs));
  }, [jobs]);

  const addJob = () => {
    if (!newJob.title || !newJob.company) {
      alert('Please fill in job title and company name');
      return;
    }

    const job = {
      ...newJob,
      id: Date.now()
    };

    setJobs([...jobs, job]);
    resetForm();
  };

  const startEdit = (job) => {
    setEditingJob(job.id);
    setNewJob({ ...job });
    setShowAddForm(true);
  };

  const saveEdit = () => {
    if (!newJob.title || !newJob.company) {
      alert('Please fill in job title and company name');
      return;
    }

    setJobs(jobs.map(job => job.id === editingJob ? newJob : job));
    resetForm();
  };

  const resetForm = () => {
    setNewJob({
      title: '',
      company: '',
      postUrl: '',
      description: '',
      status: 'saved',
      contacts: []
    });
    setShowAddForm(false);
    setEditingJob(null);
  };

  const removeJob = (id) => {
    if (window.confirm('Are you sure you want to remove this job application?')) {
      setJobs(jobs.filter(job => job.id !== id));
    }
  };

  const updateJobStatus = (id, newStatus) => {
    setJobs(jobs.map(job => 
      job.id === id ? { ...job, status: newStatus } : job
    ));
  };

  const toggleExpanded = (id) => {
    setExpandedJobs(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const addContactToJob = (jobId) => {
    if (!newContact.name) {
      alert('Please enter a contact name');
      return;
    }

    setJobs(jobs.map(job => {
      if (job.id === jobId) {
        return {
          ...job,
          contacts: [...(job.contacts || []), { ...newContact, id: Date.now() }]
        };
      }
      return job;
    }));

    setNewContact({ name: '', linkedin: '', status: 'none' });
  };

  const updateContactStatus = (jobId, contactId, newStatus) => {
    setJobs(jobs.map(job => {
      if (job.id === jobId) {
        return {
          ...job,
          contacts: job.contacts.map(contact =>
            contact.id === contactId ? { ...contact, status: newStatus } : contact
          )
        };
      }
      return job;
    }));
  };

  const removeContact = (jobId, contactId) => {
    setJobs(jobs.map(job => {
      if (job.id === jobId) {
        return {
          ...job,
          contacts: job.contacts.filter(contact => contact.id !== contactId)
        };
      }
      return job;
    }));
  };

  const stages = ['saved', 'applied', 'screen', 'interview', 'offer'];
  const stageLabels = {
    saved: 'Saved',
    applied: 'Applied',
    screen: 'Screen',
    interview: 'Interview',
    offer: 'Offer'
  };

  return (
    <div>
      {/* UI Rendering (kept exactly as original but moved here) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Job Applications</h2>
        <button
          onClick={() => {
            if (showAddForm) { resetForm(); } else { setShowAddForm(true); }
          }}
          style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #22c55e', background: '#22c55e22', color: '#e5e7eb', fontSize: '0.9rem', cursor: 'pointer' }}
        >
          {showAddForm ? 'Cancel' : 'Add Job'}
        </button>
      </div>

      {showAddForm && (
        <div style={{ padding: '16px', marginBottom: '20px', borderRadius: '8px', background: '#020617', border: '1px solid #1f2937' }}>
          <h3 style={{ marginTop: 0, fontSize: '1rem' }}>{editingJob ? 'Edit Job Application' : 'Add New Job Application'}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '4px' }}>Job Title *</label>
              <input type="text" value={newJob.title} onChange={(e) => setNewJob({ ...newJob, title: e.target.value })} placeholder="e.g. Software Engineer" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #4b5563', background: '#0f172a', color: '#e5e7eb' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '4px' }}>Company *</label>
              <input type="text" value={newJob.company} onChange={(e) => setNewJob({ ...newJob, company: e.target.value })} placeholder="e.g. Google" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #4b5563', background: '#0f172a', color: '#e5e7eb' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '4px' }}>Job Post URL</label>
              <input type="text" value={newJob.postUrl} onChange={(e) => setNewJob({ ...newJob, postUrl: e.target.value })} placeholder="https://..." style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #4b5563', background: '#0f172a', color: '#e5e7eb' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '4px' }}>Job Description</label>
              <textarea value={newJob.description} onChange={(e) => setNewJob({ ...newJob, description: e.target.value })} placeholder="Paste job description here..." rows={4} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #4b5563', background: '#0f172a', color: '#e5e7eb', resize: 'vertical' }} />
            </div>
            <button onClick={editingJob ? saveEdit : addJob} style={{ padding: '10px 20px', borderRadius: '6px', border: '1px solid #22c55e', background: '#22c55e', color: '#000', fontSize: '0.9rem', cursor: 'pointer', fontWeight: '500', marginTop: '8px' }}>
              {editingJob ? 'Save Changes' : 'Add Job Application'}
            </button>
          </div>
        </div>
      )}

      {jobs.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9ca3af', fontSize: '0.9rem' }}>No job applications yet. Click "Add Job" to get started!</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {jobs.map((job) => (
            <div key={job.id} style={{ padding: '16px', borderRadius: '8px', background: '#020617', border: '1px solid #1f2937' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: '500', color: '#e5e7eb', marginBottom: '4px' }}>{job.title}</div>
                  <div style={{ fontSize: '0.9rem', color: '#9ca3af', marginBottom: '2px' }}>{job.company}</div>
                  {job.postUrl && (
                    <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                      <a href={ensureHttps(job.postUrl)} target="_blank" rel="noopener noreferrer" style={{ color: '#22c55e', textDecoration: 'none' }}>View Job Post</a>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => toggleExpanded(job.id)} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #4b5563', background: '#1f2937', color: '#e5e7eb', fontSize: '0.8rem', cursor: 'pointer' }}>{expandedJobs[job.id] ? 'Hide Description' : 'Show Description'}</button>
                  <button onClick={() => startEdit(job)} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #3b82f6', background: '#1e3a8a22', color: '#93c5fd', fontSize: '0.8rem', cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => removeJob(job.id)} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #dc2626', background: '#7f1d1d22', color: '#fca5a5', fontSize: '0.8rem', cursor: 'pointer' }}>Remove</button>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '8px' }}>Status:</div>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  {stages.map((stage) => (
                    <label key={stage} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.9rem', color: job.status === stage ? '#22c55e' : '#9ca3af' }}>
                      <input type="radio" name={`status-${job.id}`} checked={job.status === stage} onChange={() => updateJobStatus(job.id, stage)} style={{ cursor: 'pointer' }} />
                      {stageLabels[stage]}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #1f2937' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#e5e7eb' }}>Networking Contacts</h4>
                {job.contacts && job.contacts.length > 0 ? (
                  <div style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {job.contacts.map((contact) => (
                      <div key={contact.id} style={{ padding: '10px', background: '#0f172a', borderRadius: '4px', border: '1px solid #1f2937', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '150px' }}>
                          <div style={{ fontSize: '0.9rem', color: '#e5e7eb', marginBottom: '2px' }}>{contact.name}</div>
                          {contact.linkedin && <a href={ensureHttps(contact.linkedin)} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: '#22c55e', textDecoration: 'none' }}>LinkedIn Profile</a>}
                        </div>
                        <select value={contact.status} onChange={(e) => updateContactStatus(job.id, contact.id, e.target.value)} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #4b5563', background: '#020617', color: '#e5e7eb', fontSize: '0.85rem' }}>
                          <option value="none">No action</option>
                          <option value="connected">Connected</option>
                          <option value="messaged">Messaged</option>
                          <option value="responded">They responded</option>
                        </select>
                        <button onClick={() => removeContact(job.id, contact.id)} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #dc2626', background: '#7f1d1d22', color: '#fca5a5', fontSize: '0.75rem', cursor: 'pointer' }}>Remove</button>
                      </div>
                    ))}
                  </div>
                ) : <div style={{ fontSize: '0.85rem', color: '#6b7280', fontStyle: 'italic', marginBottom: '12px' }}>No contacts added yet</div>}

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div style={{ flex: '1 1 150px' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '4px' }}>Name</label>
                    <input type="text" value={newContact.name} onChange={(e) => setNewContact({ ...newContact, name: e.target.value })} placeholder="Contact name" style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #4b5563', background: '#0f172a', color: '#e5e7eb', fontSize: '0.85rem' }} />
                  </div>
                  <div style={{ flex: '1 1 200px' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '4px' }}>LinkedIn URL</label>
                    <input type="text" value={newContact.linkedin} onChange={(e) => setNewContact({ ...newContact, linkedin: e.target.value })} placeholder="linkedin.com/in/..." style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #4b5563', background: '#0f172a', color: '#e5e7eb', fontSize: '0.85rem' }} />
                  </div>
                  <button onClick={() => addContactToJob(job.id)} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #22c55e', background: '#22c55e22', color: '#22c55e', fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>Add Contact</button>
                </div>
              </div>

              {expandedJobs[job.id] && (
                <div style={{ marginTop: '16px', padding: '16px', background: '#0f172a', borderRadius: '6px', border: '1px solid #1f2937' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#e5e7eb' }}>Job Description</h4>
                  {job.description ? <div style={{ fontSize: '0.85rem', color: '#9ca3af', whiteSpace: 'pre-wrap' }}>{job.description}</div> : <div style={{ fontSize: '0.85rem', color: '#6b7280', fontStyle: 'italic' }}>No description added</div>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}