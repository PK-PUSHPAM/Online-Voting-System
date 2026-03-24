import Election from "../models/Election.js";
import getElectionStatus from "./getElectionStatus.js";

const syncElectionStatus = async (election) => {
  const computedStatus = getElectionStatus(
    election.startDate,
    election.endDate,
  );

  if (election.status !== computedStatus) {
    election.status = computedStatus;
    await election.save({ validateBeforeSave: false });
  }

  return election;
};

export default syncElectionStatus;
