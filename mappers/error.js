function mapErrors(errors) {
    const mappedErrors = {};
    errors.array().forEach((error) => {
        mappedErrors[error.path] = error.msg;
    });
    return mappedErrors;
}

module.exports = mapErrors;
