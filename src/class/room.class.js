class roomClass {
  constructor(id, status, owner, users) {
    this.id = id;
    this.status = status;
    this.owner = owner;
    this.users = users;
    this.game = null;
  }

  checkIsOwner(userId) {
    return this.owner === userId;
  }

  addUser(userId) {
    this.users.push(userId);
  }

  deleteUser(userId) {
    this.users = [...this.users.filter((i) => i !== userId)];
  }

  deleteAllUsers(usersList) {
    this.users.map((user) => {
      const socket = usersList.find((i) => i.id === user);
      delete socket.room;
      socket.leave(this.id);
    });
  }

  initGame(game) {
    this.game = game;
  }
}

module.exports = roomClass;
