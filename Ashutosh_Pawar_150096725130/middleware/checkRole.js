// Role-Based Access Control. Runs AFTER verifyToken, so request.user is set.
// checkRole("librarian") -> only librarians pass. Others get 403 Forbidden.
function checkRole(...allowedRoles) {
  return (request, response, next) => {
    if (!request.user) {
      return response.status(401).json({ message: "Not authenticated" });
    }

    if (!allowedRoles.includes(request.user.role)) {
      return response
        .status(403)
        .json({ message: "Forbidden: you do not have access to this action" });
    }

    next();
  };
}

// Ready-made guards for the two roles in this app.
const verifyStudent = checkRole("student");
const verifyLibrarian = checkRole("librarian");

module.exports = { checkRole, verifyStudent, verifyLibrarian };
