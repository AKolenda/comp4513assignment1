const { data, error } = await supabase.rpc("execute_sql", {
  query: `
SELECT orders.id, orders.product_id, users.username
FROM orders
INNER JOIN users ON orders.user_id = users.id;
`,
});
