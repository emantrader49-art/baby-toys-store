export function ok(res, data = null, meta = undefined, status = 200) {
  const body = { success: true, data };
  if (meta) body.meta = meta;
  return res.status(status).json(body);
}

export function created(res, data = null) {
  return ok(res, data, undefined, 201);
}
