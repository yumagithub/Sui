-- Sui: 投票をリアルタイムに反映する
-- postgres_changes は votes の SELECT ポリシーに従うので、参加者にだけ届く。

alter publication supabase_realtime add table public.votes;
