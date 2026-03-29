export const APP_ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  OTP_LOGIN: "/otp-login",
  FORGOT_PASSWORD: "/forgot-password",
  UNAUTHORIZED: "/unauthorized",

  ADMIN_DASHBOARD: "/admin",
  ADMIN_ELECTIONS: "/admin/elections",
  ADMIN_POSTS: "/admin/posts",
  ADMIN_CANDIDATES: "/admin/candidates",
  ADMIN_VOTERS: "/admin/voters",
  ADMIN_RESULTS: "/admin/results",
  ADMIN_MANAGE_ADMINS: "/admin/manage-admins",
  ADMIN_SYSTEM: "/admin/system",

  VOTER_DASHBOARD: "/voter",
  VOTER_ELECTIONS: "/voter/elections",
  VOTER_MY_VOTES: "/voter/my-votes",
  VOTER_PROFILE: "/voter/profile",
  VOTER_ELECTION_DETAILS: "/voter/elections/:electionId",
};

export const buildVoterElectionDetailsRoute = (electionId = "") =>
  `/voter/elections/${electionId}`;
