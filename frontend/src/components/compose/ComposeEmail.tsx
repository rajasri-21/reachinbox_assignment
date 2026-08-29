import * as React from "react";
import { api, ApiError } from "../../services/api";
import { parseLeads } from "../../lib/csv";
import { Button } from "../ui/Button";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_RECIPIENTS = 5000;
const MAX_DELAY_MS = 86400000;
const MAX_HOURLY = 100000;

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: (count: number) => void;
};

export function ComposeEmail({ open, onClose, onSuccess }: Props): React.JSX.Element | null {
  const [senderEmail, setSenderEmail] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");
  const [startAt, setStartAt] = React.useState("");
  const [delayMs, setDelayMs] = React.useState("2000");
  const [hourlyLimit, setHourlyLimit] = React.useState("200");

  const [validRecipients, setValidRecipients] = React.useState<string[]>([]);
  const [invalidRecipients, setInvalidRecipients] = React.useState<string[]>([]);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [fileError, setFileError] = React.useState<string | null>(null);

  const [touched, setTouched] = React.useState<Record<string, boolean>>({});
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [showInvalidList, setShowInvalidList] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const firstFieldRef = React.useRef<HTMLInputElement>(null);

  const resetState = React.useCallback(() => {
    setSenderEmail("");
    setSubject("");
    setBody("");
    setStartAt("");
    setDelayMs("2000");
    setHourlyLimit("200");
    setValidRecipients([]);
    setInvalidRecipients([]);
    setFileName(null);
    setFileError(null);
    setTouched({});
    setSubmitError(null);
    setShowInvalidList(false);
    setSubmitting(false);
  }, []);

  const handleClose = React.useCallback(() => {
    if (submitting) return;
    resetState();
    onClose();
  }, [submitting, resetState, onClose]);

  // Focus management + Esc handling
  React.useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // focus first field after render
    const id = window.setTimeout(() => firstFieldRef.current?.focus(), 50);

    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(id);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, handleClose]);

  // Click outside handled via overlay; keep focus inside by initial focus

  const senderError = React.useMemo(() => {
    const trimmed = senderEmail.trim();
    if (!trimmed) return "Sender email is required";
    if (!EMAIL_RE.test(trimmed) || trimmed.length > 254) return "Enter a valid email address";
    return null;
  }, [senderEmail]);

  const subjectError = React.useMemo(() => {
    if (!subject.trim()) return "Subject is required";
    return null;
  }, [subject]);

  const bodyError = React.useMemo(() => {
    if (!body.trim()) return "Body is required";
    return null;
  }, [body]);

  const startAtError = React.useMemo(() => {
    if (!startAt) return "Start time is required";
    const d = new Date(startAt);
    if (Number.isNaN(d.getTime())) return "Enter a valid date and time";
    if (d.getTime() <= Date.now()) return "Start time must be in the future";
    return null;
  }, [startAt]);

  const delayError = React.useMemo(() => {
    if (delayMs.trim() === "") return "Delay is required";
    const n = Number(delayMs);
    if (!Number.isInteger(n)) return "Delay must be an integer";
    if (n < 0) return "Delay must be at least 0";
    if (n > MAX_DELAY_MS) return `Delay cannot exceed ${MAX_DELAY_MS} ms`;
    return null;
  }, [delayMs]);

  const hourlyError = React.useMemo(() => {
    if (hourlyLimit.trim() === "") return "Hourly limit is required";
    const n = Number(hourlyLimit);
    if (!Number.isInteger(n)) return "Hourly limit must be an integer";
    if (n < 1) return "Hourly limit must be at least 1";
    if (n > MAX_HOURLY) return `Hourly limit cannot exceed ${MAX_HOURLY}`;
    return null;
  }, [hourlyLimit]);

  const recipientsError = React.useMemo(() => {
    if (fileError) return fileError;
    if (validRecipients.length === 0 && invalidRecipients.length === 0 && !fileName) return "Upload a CSV or text file with recipients";
    if (validRecipients.length === 0) return "No valid emails detected. Check your file.";
    if (validRecipients.length > MAX_RECIPIENTS) return "Maximum 5000 recipients allowed.";
    return null;
  }, [validRecipients, invalidRecipients, fileName, fileError]);

  const handleFileChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    // Reset so same file can be re-selected
    e.target.value = "";
    if (!file) return;

    const isValidType =
      file.type === "text/csv" ||
      file.type === "text/plain" ||
      file.type === "" ||
      file.name.toLowerCase().endsWith(".csv") ||
      file.name.toLowerCase().endsWith(".txt");

    if (!isValidType) {
      setFileError("Unsupported file type. Please upload a CSV or text file.");
      setFileName(file.name);
      setValidRecipients([]);
      setInvalidRecipients([]);
      return;
    }

    setFileName(file.name);
    setFileError(null);
    setShowInvalidList(false);

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      if (text.trim().length === 0) {
        setFileError("File is empty.");
        setValidRecipients([]);
        setInvalidRecipients([]);
        return;
      }
      const { valid, invalid } = parseLeads(text);
      if (valid.length === 0 && invalid.length === 0) {
        setFileError("File is empty or contains no email addresses.");
        setValidRecipients([]);
        setInvalidRecipients([]);
        return;
      }
      if (valid.length === 0) {
        // No valid but have invalid -> show both but error will be “No valid emails detected”
        setValidRecipients([]);
        setInvalidRecipients(invalid);
        return;
      }
      if (valid.length > MAX_RECIPIENTS) {
        setFileError("Maximum 5000 recipients allowed.");
      }
      setValidRecipients(valid);
      setInvalidRecipients(invalid);
    };
    reader.onerror = () => {
      setFileError("Failed to read file. Please try again.");
      setValidRecipients([]);
      setInvalidRecipients([]);
    };
    reader.readAsText(file);
  }, []);

  const handleSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setTouched({ sender: true, subject: true, body: true, startAt: true, delay: true, hourly: true, recipients: true });
      setSubmitError(null);

      if (senderError || subjectError || bodyError || startAtError || delayError || hourlyError || recipientsError) {
        // Find first error field and focus it
        if (senderError) firstFieldRef.current?.focus();
        return;
      }

      // Convert datetime-local to ISO8601
      const isoStartAt = new Date(startAt).toISOString();
      const payload = {
        senderEmail: senderEmail.trim(),
        subject: subject.trim(),
        body: body.trim(),
        recipients: validRecipients,
        startAt: isoStartAt,
        delayMs: Number(delayMs),
        hourlyLimit: Number(hourlyLimit),
      };

      setSubmitting(true);
      try {
        const res = await api.scheduleEmails(payload);
        onSuccess(res.scheduledCount);
        resetState();
        onClose();
      } catch (err) {
        if (err instanceof ApiError) {
          if (err.status === 401) {
            setSubmitError("Session expired. Please log in again.");
          } else {
            setSubmitError(err.message);
          }
        } else if (err instanceof Error) {
          setSubmitError(err.message);
        } else {
          setSubmitError("Failed to schedule emails. Please try again.");
        }
      } finally {
        setSubmitting(false);
      }
    },
    [senderError, subjectError, bodyError, startAtError, delayError, hourlyError, recipientsError, senderEmail, subject, body, startAt, validRecipients, delayMs, hourlyLimit, onSuccess, onClose, resetState],
  );

  if (!open) return null;

  const showFieldError = (key: string, err: string | null): string | null => (touched[key] && err ? err : null);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="compose-title"
    >
      <button
        type="button"
        aria-label="Close compose dialog"
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={handleClose}
        tabIndex={-1}
      />
      <div
        ref={dialogRef}
        className="relative w-full max-w-[640px] max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-[#e5e7eb] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#f1f5f9] shrink-0">
          <h2 id="compose-title" className="text-[16px] font-semibold text-[#0f172a]">
            Compose New Email
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#10a34a]/30"
            aria-label="Close"
            disabled={submitting}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-4">
          {submitError ? (
            <div role="alert" className="rounded-lg bg-[#fef2f2] border border-[#fecaca] px-3.5 py-2.5 text-sm text-[#dc2626]">
              {submitError}
            </div>
          ) : null}

          {/* Sender email */}
          <div>
            <label htmlFor="compose-sender" className="block text-[13px] font-medium text-[#0f172a] mb-1.5">
              Sender email <span className="text-[#dc2626]" aria-hidden="true">*</span>
            </label>
            <input
              ref={firstFieldRef}
              id="compose-sender"
              type="email"
              autoComplete="email"
              placeholder="sender@example.com"
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              onBlur={() => setTouched((p) => ({ ...p, sender: true }))}
              aria-invalid={Boolean(showFieldError("sender", senderError))}
              aria-describedby={showFieldError("sender", senderError) ? "compose-sender-error" : undefined}
              className="w-full h-10 px-3.5 rounded-lg bg-white border border-[#e2e8f0] text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#94a3b8] focus:ring-2 focus:ring-[#10a34a]/20 transition-colors"
            />
            {showFieldError("sender", senderError) ? (
              <p id="compose-sender-error" role="alert" className="mt-1.5 text-xs text-[#dc2626]">
                {senderError}
              </p>
            ) : null}
          </div>

          {/* Subject */}
          <div>
            <label htmlFor="compose-subject" className="block text-[13px] font-medium text-[#0f172a] mb-1.5">
              Subject <span className="text-[#dc2626]" aria-hidden="true">*</span>
            </label>
            <input
              id="compose-subject"
              type="text"
              placeholder="Email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              onBlur={() => setTouched((p) => ({ ...p, subject: true }))}
              aria-invalid={Boolean(showFieldError("subject", subjectError))}
              aria-describedby={showFieldError("subject", subjectError) ? "compose-subject-error" : undefined}
              className="w-full h-10 px-3.5 rounded-lg bg-white border border-[#e2e8f0] text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#94a3b8] focus:ring-2 focus:ring-[#10a34a]/20 transition-colors"
            />
            {showFieldError("subject", subjectError) ? (
              <p id="compose-subject-error" role="alert" className="mt-1.5 text-xs text-[#dc2626]">
                {subjectError}
              </p>
            ) : null}
          </div>

          {/* Body */}
          <div>
            <label htmlFor="compose-body" className="block text-[13px] font-medium text-[#0f172a] mb-1.5">
              Body <span className="text-[#dc2626]" aria-hidden="true">*</span>
            </label>
            <textarea
              id="compose-body"
              placeholder="Write your email body..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onBlur={() => setTouched((p) => ({ ...p, body: true }))}
              rows={5}
              aria-invalid={Boolean(showFieldError("body", bodyError))}
              aria-describedby={showFieldError("body", bodyError) ? "compose-body-error" : undefined}
              className="w-full min-h-[110px] px-3.5 py-2.5 rounded-lg bg-white border border-[#e2e8f0] text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#94a3b8] focus:ring-2 focus:ring-[#10a34a]/20 transition-colors resize-y"
            />
            {showFieldError("body", bodyError) ? (
              <p id="compose-body-error" role="alert" className="mt-1.5 text-xs text-[#dc2626]">
                {bodyError}
              </p>
            ) : null}
          </div>

          {/* CSV / TXT upload */}
          <div>
            <label className="block text-[13px] font-medium text-[#0f172a] mb-1.5">
              Recipients (CSV / Text) <span className="text-[#dc2626]" aria-hidden="true">*</span>
            </label>
            <div
              className="rounded-xl border-2 border-dashed border-[#cbd5e1] bg-[#f8fafc] px-4 py-5 text-center hover:border-[#94a3b8] hover:bg-[#f1f5f9] transition-colors focus-within:border-[#10a34a] focus-within:ring-2 focus-within:ring-[#10a34a]/20"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,text/csv,text/plain"
                onChange={handleFileChange}
                className="sr-only"
                id="compose-file"
                aria-describedby="compose-file-help"
                tabIndex={-1}
              />
              <div className="flex flex-col items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-white border border-[#e2e8f0] flex items-center justify-center text-[#64748b]">
                  <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M8 10.5V3.5M8 3.5L5.5 6M8 3.5L10.5 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M3 10V12.5H13V10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                </div>
                <p id="compose-file-help" className="text-sm text-[#475569]">
                  {fileName ? <span className="font-medium text-[#0f172a]">{fileName}</span> : "Drag and drop or click to upload"}
                </p>
                <p className="text-xs text-[#94a3b8]">CSV or TXT with comma or newline-separated emails</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-1 inline-flex items-center justify-center h-8 px-4 rounded-full bg-white border border-[#e2e8f0] text-sm font-medium text-[#0f172a] hover:bg-[#f8fafc] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#10a34a]/30"
                  aria-label="Choose CSV or text file"
                >
                  Choose file
                </button>
                <label htmlFor="compose-file" className="sr-only">
                  Upload recipients file
                </label>
              </div>
            </div>

            {/* File feedback */}
            <div className="mt-2 space-y-1" aria-live="polite">
              {validRecipients.length > 0 ? (
                <p className="text-sm font-medium text-[#0f172a]" data-testid="valid-count">
                  {validRecipients.length} {validRecipients.length === 1 ? "email" : "emails"} detected
                </p>
              ) : null}
              {invalidRecipients.length > 0 ? (
                <div className="text-xs">
                  <button
                    type="button"
                    onClick={() => setShowInvalidList((v) => !v)}
                    className="text-[#dc2626] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#dc2626]/20 rounded"
                    aria-expanded={showInvalidList}
                  >
                    {invalidRecipients.length} invalid {invalidRecipients.length === 1 ? "email" : "emails"}
                    <span className="ml-1">{showInvalidList ? "▴" : "▾"}</span>
                  </button>
                  {showInvalidList ? (
                    <ul className="mt-1.5 max-h-20 overflow-y-auto rounded-lg border border-[#fecaca] bg-[#fef2f2] px-2.5 py-2 space-y-0.5 text-[#991b1b] break-all">
                      {invalidRecipients.slice(0, 100).map((e) => (
                        <li key={e} className="text-[11px]">
                          {e}
                        </li>
                      ))}
                      {invalidRecipients.length > 100 ? <li className="text-[11px] opacity-60">… and {invalidRecipients.length - 100} more</li> : null}
                    </ul>
                  ) : null}
                </div>
              ) : null}
              {showFieldError("recipients", recipientsError) ? (
                <p role="alert" className="text-xs text-[#dc2626]">
                  {recipientsError}
                </p>
              ) : null}
            </div>
          </div>

          {/* Start time */}
          <div>
            <label htmlFor="compose-startAt" className="block text-[13px] font-medium text-[#0f172a] mb-1.5">
              Start time <span className="text-[#dc2626]" aria-hidden="true">*</span>
            </label>
            <input
              id="compose-startAt"
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              onBlur={() => setTouched((p) => ({ ...p, startAt: true }))}
              aria-invalid={Boolean(showFieldError("startAt", startAtError))}
              aria-describedby={showFieldError("startAt", startAtError) ? "compose-startAt-error" : undefined}
              className="w-full h-10 px-3.5 rounded-lg bg-white border border-[#e2e8f0] text-sm text-[#0f172a] focus:outline-none focus:border-[#94a3b8] focus:ring-2 focus:ring-[#10a34a]/20 transition-colors"
            />
            {showFieldError("startAt", startAtError) ? (
              <p id="compose-startAt-error" role="alert" className="mt-1.5 text-xs text-[#dc2626]">
                {startAtError}
              </p>
            ) : null}
            <p className="mt-1 text-xs text-[#94a3b8]">Scheduling begins at this time. Converted to ISO8601 on submit.</p>
          </div>

          {/* Delay and Hourly grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="compose-delay" className="block text-[13px] font-medium text-[#0f172a] mb-1.5">
                Delay between emails (ms)
              </label>
              <input
                id="compose-delay"
                type="number"
                inputMode="numeric"
                min={0}
                max={MAX_DELAY_MS}
                step={1}
                placeholder="2000"
                value={delayMs}
                onChange={(e) => setDelayMs(e.target.value)}
                onBlur={() => setTouched((p) => ({ ...p, delay: true }))}
                aria-invalid={Boolean(showFieldError("delay", delayError))}
                aria-describedby="compose-delay-help compose-delay-error"
                className="w-full h-10 px-3.5 rounded-lg bg-white border border-[#e2e8f0] text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#94a3b8] focus:ring-2 focus:ring-[#10a34a]/20 transition-colors"
              />
              <p id="compose-delay-help" className="mt-1 text-xs text-[#94a3b8]">
                {(() => {
                  const n = Number(delayMs);
                  if (!Number.isFinite(n) || delayMs.trim() === "") return "0 – 86400000 ms";
                  return `${n} ms = ${(n / 1000).toFixed(2)}s`;
                })()}
              </p>
              {showFieldError("delay", delayError) ? (
                <p id="compose-delay-error" role="alert" className="mt-1 text-xs text-[#dc2626]">
                  {delayError}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="compose-hourly" className="block text-[13px] font-medium text-[#0f172a] mb-1.5">
                Hourly limit
              </label>
              <input
                id="compose-hourly"
                type="number"
                inputMode="numeric"
                min={1}
                max={MAX_HOURLY}
                step={1}
                placeholder="200"
                value={hourlyLimit}
                onChange={(e) => setHourlyLimit(e.target.value)}
                onBlur={() => setTouched((p) => ({ ...p, hourly: true }))}
                aria-invalid={Boolean(showFieldError("hourly", hourlyError))}
                aria-describedby={showFieldError("hourly", hourlyError) ? "compose-hourly-error" : undefined}
                className="w-full h-10 px-3.5 rounded-lg bg-white border border-[#e2e8f0] text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#94a3b8] focus:ring-2 focus:ring-[#10a34a]/20 transition-colors"
              />
              {showFieldError("hourly", hourlyError) ? (
                <p id="compose-hourly-error" role="alert" className="mt-1.5 text-xs text-[#dc2626]">
                  {hourlyError}
                </p>
              ) : null}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={handleClose} disabled={submitting} className="border border-[#e2e8f0] bg-white">
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting} aria-busy={submitting} className="min-w-[120px]">
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" aria-hidden="true" />
                  Scheduling...
                </span>
              ) : (
                "Schedule"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
