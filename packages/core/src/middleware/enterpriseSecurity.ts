export type ValidationRule = {
  field: string;
  required?: boolean;
  pattern?: RegExp;
};

export function sanitizeHtml(raw: string) {
  return raw.replace(/[<>]/g, '').replace(/javascript:/gi, '');
}

export function validateInput(payload: Record<string, unknown>, rules: ValidationRule[]) {
  const errors: string[] = [];

  for (const rule of rules) {
    const value = payload[rule.field];
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(`Campo obrigatório ausente: ${rule.field}`);
      continue;
    }

    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
      errors.push(`Campo inválido: ${rule.field}`);
    }
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

export type Role = 'admin' | 'editor' | 'viewer';

export function authorize(required: Role[], actual: Role) {
  return required.includes(actual);
}

export function csrfTokenFor(sessionId: string, secret: string) {
  const source = `${sessionId}:${secret}`;
  let hash = 0;
  for (let i = 0; i < source.length; i += 1) {
    hash = (hash * 31 + source.charCodeAt(i)) | 0;
  }

  return `csrf_${Math.abs(hash).toString(36)}`;
}
