const checkRoom = (roomId, roomsList) => {
  return roomsList.find((i) => i.id === roomId);
};

const checkIsOwner = (userId, roomId, roomsList) => {
  const room = roomsList.find((i) => i.id === roomId);
  return room.owner === userId;
};

const getPublicGames = (roomsList) => {
  return roomsList.filter((i) => i.status === "public");
};

const removeAllUsersFromRoom = (roomId, roomsList, usersList) => {
  const roomUsers = checkRoom(roomId, roomsList).users;
  roomUsers.map((user) => {
    const socket = usersList.find((i) => i.id === user);
    delete socket.room;
    socket.leave(roomId);
  });
};

const removeOnUserFromRoom = (userId, roomId, roomsList) => {
  const roomIndex = roomsList.findIndex((i) => i.id === roomId);
  const room = roomsList.find((i) => i.id === roomId);
  const { users } = room;
  room.users = users.filter((i) => i !== userId);
  roomsList[roomIndex] = room;
  return roomsList;
};

const addUserToRoom = (userId, roomId, roomsList) => {
  const roomIndex = roomsList.findIndex((i) => i.id === roomId);
  const room = roomsList.find((i) => i.id === roomId);
  room.users.push(userId);
  roomsList[roomIndex] = room;
  return roomsList;
};

const deleteRoom = (roomId, roomsList) => {
  return roomsList.filter((i) => i.id !== roomId);
};

module.exports = {
  checkRoom,
  checkIsOwner,
  getPublicGames,
  removeAllUsersFromRoom,
  removeOnUserFromRoom,
  addUserToRoom,
  deleteRoom,
};
