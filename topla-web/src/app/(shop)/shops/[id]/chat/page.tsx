import ShopChatClient from './shop-chat-client';

export default async function ShopChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ShopChatClient shopId={id} />;
}
