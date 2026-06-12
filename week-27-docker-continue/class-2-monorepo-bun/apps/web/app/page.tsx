import { prisma } from "@repo/db/prisma";

export default async function Home() {
  const users = await prisma.user.findMany({});
  console.log(users);
  return <div>Home Page! {JSON.stringify(users)}</div>;
}
