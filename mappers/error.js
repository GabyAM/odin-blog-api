function mapErrors(errors) {
    const mappedErrors = {};
    if (Array.isArray(errors.errors)) {
        errors.array().forEach((error) => {
            mappedErrors[error.path] = error.msg;
        });
    } else {
        const nestedErrors = errors.errors;
        for (const key in nestedErrors) {
            mappedErrors[key] = nestedErrors[key].message;
        }
    }
    return mappedErrors;
}

module.exports = mapErrors;
