const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();
app.use(express.json());

let db = null;

const initializeDBServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at: http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initializeDBServer();

let convertSnakeCaseToCamelCaseObjectOfPlayer = (object) => {
  return {
    playerId: object.player_id,
    playerName: object.player_name,
  };
};

//Get Players API
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `SELECT * FROM player_details;`;
  const playerObjects = await db.all(getPlayersQuery);
  response.send(
    playerObjects.map((eachObject) =>
      convertSnakeCaseToCamelCaseObjectOfPlayer(eachObject)
    )
  );
});

//Get Player API
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `SELECT * FROM player_details
                            WHERE player_id = ${playerId};`;
  const playerObject = await db.get(getPlayerQuery);
  response.send(convertSnakeCaseToCamelCaseObjectOfPlayer(playerObject));
});

//Update Player API
app.put("/players/:playerId/", async (request, response) => {
  const { playerName } = request.body;
  const { playerId } = request.params;
  const updatePlayerQuery = `UPDATE player_details
                                SET player_name = '${playerName}'
                                WHERE player_id = ${playerId};`;
  const updatePlayerObject = await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

const convertSnakeCaseToCamelCaseObjectOfMatch = (object) => {
  return {
    matchId: object.match_id,
    match: object.match,
    year: object.year,
  };
};

//Get Match API
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `SELECT * FROM match_details
                            WHERE match_id = ${matchId};`;
  const matchObject = await db.get(getMatchQuery);
  response.send(convertSnakeCaseToCamelCaseObjectOfMatch(matchObject));
});

//Get MatchOfPlayer API
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchPlayersQuery = `SELECT 
                                     * 
                                    FROM player_match_score
                                    NATURAL JOIN match_details
                                    WHERE player_id = ${playerId};`;
  const matchPlayersObject = await db.all(getMatchPlayersQuery);
  response.send(
    matchPlayersObject.map((echPlayer) =>
      convertSnakeCaseToCamelCaseObjectOfMatch(echPlayer)
    )
  );
});

//Get MatchOfPlayer API
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerOfMatchQuery = `SELECT 
                                    player_details.player_id AS playerId,
                                    player_details.player_name AS playerName
                                    FROM player_match_score NATURAL JOIN player_details
                                    WHERE match_id = ${matchId};`;
  const playersMatchObject = await db.all(getPlayerOfMatchQuery);
  response.send(playersMatchObject);
  //playersMatchObject.map((echPlayer) =>
  //convertSnakeCaseToCamelCaseObjectOfPlayer(echPlayer)
  // )
  // );
});

//Get playerTotalValues API
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayersTotalValues = `SELECT
                                    player_details.player_id AS playerId,
                                    player_details.player_name AS playerName,
                                    SUM(player_match_score.score) AS totalScore,
                                    SUM(fours) AS totalFours,
                                    SUM(sixes) AS totalSixes FROM 
                                    player_details INNER JOIN player_match_score ON
                                    player_details.player_id = player_match_score.player_id
                                    WHERE player_details.player_id = ${playerId};`;
  const playersTotalValues = await db.get(getPlayersTotalValues);
  response.send(playersTotalValues);
});

module.exports = app;
