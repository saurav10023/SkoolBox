app.use((err, req, res, next) => {
  if (err.code === 11000) {
    return res.status(400).json(
      new ApiResponse(
        400,
        null,
        "Duplicate transaction detected"
      )
    );
  }

  return res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});