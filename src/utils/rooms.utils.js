const getPublicGames = (roomsList) => {
  let publicGames = [];
  roomsList.forEach((room) => {
    if (room.status === "public") {
      publicGames.push(room);
    }
  });
  return publicGames;
};

module.exports = {
  getPublicGames,
};
