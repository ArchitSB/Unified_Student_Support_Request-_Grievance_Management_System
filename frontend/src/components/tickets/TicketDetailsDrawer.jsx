import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Button, Card, PriorityBadge, StatusBadge } from '../ui'
import { resolveApiAssetUrl } from '../../lib/api'
import { createAppSocket } from '../../lib/socket'

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'N/A'

const formatRemaining = (milliseconds) => {
  if (milliseconds === null || milliseconds === undefined) return 'Not configured'
  if (milliseconds <= 0) return 'Overdue'

  const totalHours = Math.floor(milliseconds / (60 * 60 * 1000))
  const totalMinutes = Math.floor((milliseconds % (60 * 60 * 1000)) / (60 * 1000))

  if (totalHours >= 24) {
    const days = Math.floor(totalHours / 24)
    return `${days}d ${totalHours % 24}h left`
  }

  return `${totalHours}h ${totalMinutes}m left`
}

const getSlaClasses = (level) => {
  if (level === 'critical') return 'border-rose-200 bg-rose-50 text-rose-700'
  if (level === 'warning') return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-emerald-200 bg-emerald-50 text-emerald-700'
}

function TicketDetailsDrawer({ isOpen, requestId, onClose, api, userRole, socket, onRequestMutated }) {
  const { token } = useAuth()
  const [workspace, setWorkspace] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [commentMessage, setCommentMessage] = useState('')
  const [commentVisibility, setCommentVisibility] = useState('PUBLIC')
  const [replyToId, setReplyToId] = useState('')
  const [reopenMessage, setReopenMessage] = useState('')
  const [feedback, setFeedback] = useState({ rating: '5', review: '' })
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [isSubmittingAttachment, setIsSubmittingAttachment] = useState(false)
  const [isSubmittingReopen, setIsSubmittingReopen] = useState(false)
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)
  const onRequestMutatedRef = useRef(onRequestMutated)

  useEffect(() => {
    onRequestMutatedRef.current = onRequestMutated
  }, [onRequestMutated])

  const loadWorkspace = useCallback(async () => {
    if (!requestId) return

    setIsLoading(true)
    setError('')

    try {
      const response = await api.getWorkspace(requestId)
      setWorkspace(response?.data || null)
    } catch (err) {
      setError(err.message || 'Failed to load ticket workspace')
    } finally {
      setIsLoading(false)
    }
  }, [api, requestId])

  useEffect(() => {
    if (!isOpen || !requestId) return
    loadWorkspace()
  }, [isOpen, requestId, loadWorkspace])

  useEffect(() => {
    if (!isOpen || !requestId) return undefined

    const liveSocket = socket || createAppSocket(token)
    if (!liveSocket) return undefined

    liveSocket.emit('request:subscribe', requestId)
    const handleRefresh = (payload) => {
      if (payload?.requestId === String(requestId)) {
        loadWorkspace()
        onRequestMutatedRef.current?.()
      }
    }

    liveSocket.on('request:updated', handleRefresh)
    liveSocket.on('request:comment', handleRefresh)
    liveSocket.on('request:attachment', handleRefresh)

    return () => {
      liveSocket.emit('request:unsubscribe', requestId)
      liveSocket.off('request:updated', handleRefresh)
      liveSocket.off('request:comment', handleRefresh)
      liveSocket.off('request:attachment', handleRefresh)
      if (!socket) {
        liveSocket.disconnect()
      }
    }
  }, [isOpen, loadWorkspace, requestId, socket, token])

  const request = workspace?.request
  const canAddInternalNote = workspace?.availableActions?.canAddInternalNote
  const comments = workspace?.comments || []
  const attachments = workspace?.attachments || []
  const activity = workspace?.activity || []
  const escalationHistory = workspace?.escalationHistory || []
  const workflowStages = useMemo(() => request?.workflowStages || [], [request?.workflowStages])

  const workflowProgress = useMemo(() => {
    return workflowStages.filter((stage) => stage.state === 'completed').length
  }, [workflowStages])

  const handleCommentSubmit = async () => {
    if (!commentMessage.trim()) return

    setIsSubmittingComment(true)
    setError('')

    try {
      await api.addComment(requestId, {
        message: commentMessage.trim(),
        visibility: commentVisibility,
        parentCommentId: replyToId || null,
      })
      setCommentMessage('')
      setReplyToId('')
      setCommentVisibility('PUBLIC')
      await loadWorkspace()
      onRequestMutatedRef.current?.()
    } catch (err) {
      setError(err.message || 'Failed to add comment')
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleAttachmentUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsSubmittingAttachment(true)
    setError('')

    try {
      await api.uploadAttachment(requestId, file)
      await loadWorkspace()
      onRequestMutatedRef.current?.()
    } catch (err) {
      setError(err.message || 'Failed to upload attachment')
    } finally {
      setIsSubmittingAttachment(false)
      event.target.value = ''
    }
  }

  const handleReopen = async () => {
    if (!reopenMessage.trim()) return

    setIsSubmittingReopen(true)
    setError('')

    try {
      await api.reopenRequest(requestId, { message: reopenMessage.trim() })
      setReopenMessage('')
      await loadWorkspace()
      onRequestMutatedRef.current?.()
    } catch (err) {
      setError(err.message || 'Failed to reopen request')
    } finally {
      setIsSubmittingReopen(false)
    }
  }

  const handleFeedbackSubmit = async () => {
    setIsSubmittingFeedback(true)
    setError('')

    try {
      await api.submitFeedback(requestId, {
        rating: Number(feedback.rating),
        review: feedback.review.trim(),
      })
      await loadWorkspace()
      onRequestMutatedRef.current?.()
    } catch (err) {
      setError(err.message || 'Failed to submit feedback')
    } finally {
      setIsSubmittingFeedback(false)
    }
  }

  return (
    <>
      <aside
        className={`fixed inset-y-0 right-0 z-[70] w-full max-w-3xl overflow-y-auto border-l border-slate-200 bg-white p-5 shadow-2xl transition-transform duration-200 ease-out dark:border-slate-700 dark:bg-slate-900 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Ticket Workspace</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Detailed ticket intelligence, collaboration, and workflow context
            </p>
          </div>
          <Button variant="secondary" className="h-9 px-3 text-xs" onClick={onClose}>
            Close
          </Button>
        </div>

        {error ? <p className="mb-4 text-sm text-rose-600">{error}</p> : null}

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ) : request ? (
          <div className="space-y-5 pb-8">
            <Card>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {request.ticketId || 'Pending Ticket ID'}
                    </span>
                    <StatusBadge status={request.status} />
                    <PriorityBadge priority={request.priority} />
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getSlaClasses(request.sla?.level)}`}>
                      SLA: {formatRemaining(request.sla?.remainingMs)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{request.title}</h3>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{request.description}</p>
                  </div>
                </div>

                <div className="min-w-[220px] rounded-2xl border border-slate-200 bg-slate-50/90 p-4 text-sm dark:border-slate-700 dark:bg-slate-800/70">
                  <div className="grid gap-2">
                    <div className="flex justify-between gap-3">
                      <span className="text-slate-500 dark:text-slate-400">Department</span>
                      <span className="font-medium">{request.departmentId?.name || 'General'}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-slate-500 dark:text-slate-400">Category</span>
                      <span className="font-medium">{request.category || request.type}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-slate-500 dark:text-slate-400">Workflow Stage</span>
                      <span className="font-medium">Step {request.currentStep || 1}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-slate-500 dark:text-slate-400">Assigned Officer</span>
                      <span className="font-medium">{request.assignedTo?.name || 'Unassigned'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Created</p>
                  <p className="font-medium">{formatDateTime(request.createdAt)}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Last Updated</p>
                  <p className="font-medium">{formatDateTime(request.updatedAt)}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Student</p>
                  <p className="font-medium">{request.studentId?.name || 'Unknown'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{request.studentId?.email || 'No email'}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Expected Resolution</p>
                  <p className="font-medium">{formatDateTime(request.sla?.dueAt)}</p>
                </div>
              </div>
            </Card>

            <Card title="Workflow Visualization" subtitle={`Completed stages: ${workflowProgress}/${workflowStages.length}`}>
              <div className="grid gap-4 md:grid-cols-5">
                {workflowStages.map((stage) => (
                  <div key={`${stage.label}-${stage.order}`} className="relative">
                    <div
                      className={`rounded-2xl border px-3 py-4 text-center text-sm font-medium ${
                        stage.state === 'completed'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : stage.state === 'current'
                            ? 'border-sky-200 bg-sky-50 text-sky-700'
                            : 'border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {stage.label}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Escalation History" subtitle="Automatic and manual escalation trail for operational governance">
              <div className="space-y-3">
                {escalationHistory.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No escalations recorded for this ticket.</p>
                ) : (
                  escalationHistory.map((item) => (
                    <div key={item._id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {item.mode === 'AUTO' ? 'Automatic escalation' : 'Manual escalation'}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {item.escalatedById?.name || 'System'} • {item.escalatedById?.role || 'SYSTEM'}
                          </p>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{formatDateTime(item.createdAt)}</p>
                      </div>
                      <p className="mt-3 text-sm text-slate-700 dark:text-slate-200">{item.reason}</p>
                      <div className="mt-3 grid gap-3 text-xs text-slate-500 dark:text-slate-400 md:grid-cols-2">
                        <p>
                          Stage: {item.fromStage || 'Current'} to {item.toStage || 'Next'}
                        </p>
                        <p>
                          Assignee: {item.fromAssigneeId?.name || 'Unassigned'} to {item.toAssigneeId?.name || 'Queue'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
              <Card title="Activity Timeline" subtitle="Operational chronology with actors and timestamps">
                <div className="space-y-3">
                  {activity.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No activity recorded yet.</p>
                  ) : (
                    activity.map((item) => (
                      <div key={item.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">{item.actor?.name || 'System'}</p>
                            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{item.role}</p>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{formatDateTime(item.timestamp)}</p>
                        </div>
                        <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{item.description}</p>
                        {item.metadata?.message ? (
                          <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {item.metadata.message}
                          </p>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </Card>

              <div className="space-y-5">
                <Card title="Attachments" subtitle="Documents, screenshots, and supporting files">
                  <div className="space-y-3">
                    <label className="inline-flex cursor-pointer items-center rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">
                      <input type="file" className="hidden" onChange={handleAttachmentUpload} disabled={isSubmittingAttachment} />
                      {isSubmittingAttachment ? 'Uploading...' : 'Upload Attachment'}
                    </label>

                    {attachments.length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400">No attachments uploaded yet.</p>
                    ) : (
                      attachments.map((attachment) => (
                        <a
                          key={attachment._id}
                          href={resolveApiAssetUrl(attachment.url)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                        >
                          <div>
                            <p className="font-medium">{attachment.originalName}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Uploaded by {attachment.uploaderId?.name || 'Unknown'} • {formatDateTime(attachment.createdAt)}
                            </p>
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400">Open</span>
                        </a>
                      ))
                    )}
                  </div>
                </Card>

                {workspace?.availableActions?.canReopen ? (
                  <Card title="Reopen Request" subtitle="Add clarification if the issue is not fully resolved">
                    <div className="space-y-3">
                      <textarea
                        rows={4}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
                        placeholder="Explain why the request should be reopened..."
                        value={reopenMessage}
                        onChange={(event) => setReopenMessage(event.target.value)}
                      />
                      <Button onClick={handleReopen} disabled={isSubmittingReopen}>
                        {isSubmittingReopen ? 'Reopening...' : 'Reopen Ticket'}
                      </Button>
                    </div>
                  </Card>
                ) : null}

                {userRole === 'STUDENT' && request.status === 'RESOLVED' ? (
                  <Card title="Resolution Feedback" subtitle="Capture satisfaction and review text for service quality">
                    <div className="space-y-3">
                      <select
                        className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
                        value={feedback.rating}
                        onChange={(event) => setFeedback((prev) => ({ ...prev, rating: event.target.value }))}
                      >
                        {[5, 4, 3, 2, 1].map((rating) => (
                          <option key={rating} value={rating}>
                            {rating} / 5
                          </option>
                        ))}
                      </select>
                      <textarea
                        rows={4}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
                        placeholder="Share your satisfaction feedback..."
                        value={feedback.review}
                        onChange={(event) => setFeedback((prev) => ({ ...prev, review: event.target.value }))}
                      />
                      <Button onClick={handleFeedbackSubmit} disabled={isSubmittingFeedback}>
                        {isSubmittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                      </Button>
                    </div>
                  </Card>
                ) : null}
              </div>
            </div>

            <Card title="Comments & Collaboration" subtitle="Public discussion plus internal notes for support teams">
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                  <textarea
                    rows={4}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
                    placeholder="Add a comment or use @mentions in plain text..."
                    value={commentMessage}
                    onChange={(event) => setCommentMessage(event.target.value)}
                  />

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      {canAddInternalNote ? (
                        <select
                          className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
                          value={commentVisibility}
                          onChange={(event) => setCommentVisibility(event.target.value)}
                        >
                          <option value="PUBLIC">Public</option>
                          <option value="INTERNAL_ONLY">Internal only</option>
                        </select>
                      ) : null}
                      {replyToId ? (
                        <button
                          type="button"
                          className="text-xs font-medium text-slate-500 underline"
                          onClick={() => setReplyToId('')}
                        >
                          Cancel reply
                        </button>
                      ) : null}
                    </div>
                    <Button onClick={handleCommentSubmit} disabled={isSubmittingComment}>
                      {isSubmittingComment ? 'Sending...' : 'Add Comment'}
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {comments.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No comments yet.</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment._id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">{comment.senderId?.name || 'Unknown user'}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {comment.senderId?.role || 'USER'} • {formatDateTime(comment.createdAt)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${
                                comment.visibility === 'INTERNAL_ONLY'
                                  ? 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700'
                                  : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}
                            >
                              {comment.visibility === 'INTERNAL_ONLY' ? 'Internal only' : 'Public'}
                            </span>
                            <Button
                              variant="ghost"
                              className="h-8 px-2 text-xs"
                              onClick={() => setReplyToId(comment._id)}
                            >
                              Reply
                            </Button>
                          </div>
                        </div>
                        {comment.parentCommentId ? (
                          <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                            Replying to previous comment
                          </div>
                        ) : null}
                        <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{comment.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">Select a request to open the ticket workspace.</p>
        )}
      </aside>

      {isOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-[65] bg-slate-900/40"
          onClick={onClose}
          aria-label="Close ticket workspace"
        />
      ) : null}
    </>
  )
}

export default TicketDetailsDrawer
