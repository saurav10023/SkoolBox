import { admin } from "../utils/firebase.js";
import { ApiError } from "../utils/ApiError.js";

const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization) {
      throw new ApiError(401, "Authorization header missing");
    }

    if (!authorization.startsWith("Bearer ")) {
      throw new ApiError(401, "Invalid authorization header");
    }

    const idToken = authorization.split(" ")[1];

    const decodedToken = await admin.auth().verifyIdToken(idToken);

    req.firebaseUser = {
      uid: decodedToken.uid,
      mobileNumber: decodedToken.phone_number
    };

    next();
  } catch (error) {
    next(
      error instanceof ApiError
        ? error
        : new ApiError(401, "Invalid Firebase token")
    );
  }
};

export { verifyFirebaseToken };