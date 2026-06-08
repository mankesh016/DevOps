import { client } from "@repo/db/client";

export default async function Home() {
  const users = await client.user.findMany();
  console.log(users);

  return (
    <div>
      <h1>Users</h1>
      <ul>
        {users.map((user) => (
          <li key={user.id}>{user.username}</li>
        ))}
      </ul>
    </div>
  );
}
