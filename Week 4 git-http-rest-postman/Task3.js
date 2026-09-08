const BASE_URL = "https://jsonplaceholder.typicode.com";

// Fetch the selected user and then fetch posts belonging to that user
async function getUserDetails(userId) {
  try {
    const userRes = await fetch(`${BASE_URL}/users/${userId}`);
    if (!userRes.ok) {
      throw new Error(`User ${userId} not found`);
    }
    const user = await userRes.json();

    const postsRes = await fetch(`${BASE_URL}/posts?userId=${userId}`);
    const posts = await postsRes.json();

    return { user, posts };
  } catch (error) {
    return { error: `Could not load user ${userId}: ${error.message}` };
  }
}

// fetch several users at the same time
async function getMultipleUsers(ids) {
  const promises = [];
  for (let i = 0; i < ids.length; i++) {
    promises.push(getUserDetails(ids[i]));
  }
  const results = await Promise.all(promises);
  return results;
}

async function runTests() {
  const singleUser = await getUserDetails(1);
  console.log("Single user:", singleUser);

  const invalidUser = await getUserDetails(9999);
  console.log("Invalid user:", invalidUser);

  const multipleUsers = await getMultipleUsers([1, 2, 3]);
  console.log("Multiple users:", multipleUsers);
}

runTests();