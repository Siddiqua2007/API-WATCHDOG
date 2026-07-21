const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.name === "CastError") {
    return res.status(400).json({ error: `Invalid ${err.path}: "${err.value}".` });
  }

  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: messages.join(" ") });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    return res.status(409).json({ error: `${field} already exists.` });
  }

  const status = err.statusCode || 500;
  res.status(status).json({ error: err.message || "Something went wrong on the server." });
};

export default errorHandler;