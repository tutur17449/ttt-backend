const checkUser = (newUser, usersList) => {
  return usersList.find((i) => i.username === newUser);
};

const removeUser = (currentUser, usersList) => {
  return usersList.filter((i) => i.id !== currentUser);
};

module.exports = {
  checkUser,
  removeUser,
};
