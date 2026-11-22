export default function ErrorMessage({ message }) { return message ? <div className="alert alert-error" role="alert">{message}</div> : null; }
