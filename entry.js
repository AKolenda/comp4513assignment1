require("dotenv").config({ path: "config.env" });
const express = require("express");
const supa = require("@supabase/supabase-js");
const { title } = require("process");
const app = express();

const supabaseUrl = process.env.PROJECT_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = supa.createClient(supabaseUrl, supabaseKey);

// this returns all of the eras
app.get("/api/eras", async (req, resp) => {
  const { data, error } = await supabase.from("Eras").select();
  if (error) return defaultError(error, resp);
  resp.send(data);
});

// this returns everything from galleries
app.get("/api/galleries", async (req, resp) => {
  const { data, error } = await supabase.from("Galleries").select();
  if (error) return defaultError(error, resp);
  resp.send(data);
});

// this returns all params associated with a specific gallery id
app.get("/api/galleries/:ref", async (req, resp) => {
  const param = req.params.ref.toLowerCase();
  const { data, error } = await supabase
    .from("Galleries")
    .select()
    .match({ galleryId: param });
  if (error) return defaultError(error, resp);
  resp.send(data);
});

// this all fields associated with a specific country
app.get("/api/galleries/country/:substring", async (req, resp) => {
  const param = req.params.substring.toLowerCase();
  const { data, error } = await supabase
    .from("Galleries")
    .select()
    .ilike("galleryCountry", `%${param}%`);
  if (error) return defaultError(error, resp);
  resp.send(data);
});

// return everything from artists route
app.get("/api/artists", async (req, resp) => {
  const { data, error } = await supabase.from("Artists").select();
  if (error) return defaultError(error, resp);
  resp.send(data);
});

// return all fields associated with a specific artistId
app.get("/api/artists/:ref", async (req, resp) => {
  const param = req.params.ref;
  const { data, error } = await supabase
    .from("Artists")
    .select()
    .match({ artistId: param });
  if (error) return defaultError(error, resp);
  resp.send(data);
});

// substring and string return all fields associated with a specific artist lastName
app.get("/api/artists/search/:substring", async (req, resp) => {
  const param = req.params.substring.toLowerCase();
  const { data, error } = await supabase
    .from("Artists")
    .select()
    .ilike("lastName", `%${param}%`);
  if (error) return defaultError(error, resp);
  resp.send(data);
});

// Returns artists nationality (case insensitive) begins with substring
app.get("/api/artists/country/:substring", async (req, resp) => {
  const param = req.params.substring.toLowerCase();
  const { data, error } = await supabase
    .from("Artists")
    .select()
    .ilike("nationality", `%${param}%`);
  if (error) return defaultError(error, resp);
  resp.send(data);
});

// returns all data regarding paintings; aka, does an automatic join with Artists and Galleries
app.get("/api/paintings", async (req, resp) => {
  const { data, error } = await supabase
    .from("Paintings")
    .select(
      `
      *, Artists(*), Galleries(*)
    `
    )
    .order("title", { ascending: true });
  if (error) return defaultError(error, resp);
  resp.send(data);
});

// returns all data regarding paintings sorted by title or yearOfWork
app.get("/api/paintings/sort/:field", async (req, resp) => {
  let field = req.params.field.toLowerCase();
  if (field !== "title" && field !== "year") {
    return resp
      .status(400)
      .send("Invalid sorting field. Use 'title' or 'yearOfWork'.");
  }
  if (field == "year") {
    field = "yearOfWork";
  }

  const { data, error } = await supabase
    .from("Paintings")
    .select(
      `
      *, Artists(*), Galleries(*)
    `
    )
    .order(field, { ascending: true });

  if (error) return defaultError(error, resp);
  resp.send(data);
});

// returns all data regarding paintings with a specific title
app.get("/api/paintings/:ref", async (req, resp) => {
  const ref = req.params.ref.toLowerCase();
  const { data, error } = await supabase
    .from("Paintings")
    .select(
      `
      *, Artists(*), Galleries(*)
    `
    )
    .match({ paintingId: ref })
    .order("title", { ascending: true });

  if (error) return defaultError(error, resp);
  resp.send(data);
});

// Returns the paintings whose title (case insensitive) contains the
// provided substring, e.g., /api/paintings/search/port
app.get("/api/paintings/search/:substring", async (req, resp) => {
  const substring = req.params.substring.toLowerCase();
  const { data, error } = await supabase
    .from("Paintings")
    .select(
      `
      *, Artists(*), Galleries(*)
    `
    )
    .ilike("title", `%${substring}%`)
    .order("title", { ascending: true });

  if (error) return defaultError(error, resp);
  resp.send(data);
});

// getting paintings by years, starting and end date
app.get("/api/paintings/years/:start/:end", async (req, resp) => {
  const start = Number(req.params.start);
  const end = Number(req.params.end);

  // if no num is passed
  if (isNaN(start || end)) {
    return resp.status(400).json({
      error: true,
      message: "Parameter must be a number",
      details: "Invalid input parameter",
    });
  }

  // self explanatory
  if (start > end) {
    return resp.status(400).json({
      error: true,
      message: `End year cannot be > than start year`,
      details: "fix it",
    });
  }

  const { data, error } = await supabase
    .from("Paintings")
    .select(
      `
          *, Artists(*), Galleries(*)
        `
    )
    .gte("yearOfWork", start)
    .lte("yearOfWork", end)
    .order("yearOfWork", { ascending: true });

  if (error) return defaultError(error, resp);
  resp.send(data);
});

// getting paintings by specific galleryId
app.get("/api/paintings/galleries/:ref", async (req, resp) => {
  const params = req.params.ref.toLowerCase();
  // unfortunately I cannot control the order in which the data appears 🤷‍♀️
  const { data, error } = await supabase
    .from("Paintings")
    .select(
      `
            Galleries(galleryId), *, Artists(*)
          `
    )
    .match({ galleryId: params })
    .order("title", { ascending: true });

  if (error) return defaultError(error, resp);
  resp.send(data);
});

// getting paintings by a specific artistId
app.get("/api/paintings/artist/:ref", async (req, resp) => {
  const params = req.params.ref.toLowerCase();
  const { data, error } = await supabase
    .from("Paintings")
    .select(
      `
              *, Artists(*), Galleries(*)
            `
    )
    .match({ artistId: params })
    .order("title", { ascending: true });

  if (error) return defaultError(error, resp);
  resp.send(data);
});

// getting all paintings of artists whose nationality begins with a substring
app.get("/api/paintings/artists/country/:ref", async (req, resp) => {
  const params = req.params.ref.toLowerCase();
  const { data, error } = await supabase
    .from("Paintings")
    .select(
      `
      *, 
      Artists!inner(*), 
      Galleries(*)
    `
    )
    .ilike("Artists.nationality", `%${params}%`)
    .order("title", { ascending: true });

  if (error) return defaultError(error, resp);
  resp.send(data);
});

// returns all genres
app.get("/api/genres", async (req, resp) => {
  const { data, error } = await supabase.from("Genres").select(
    `
      *, 
      Eras(*)
    `
  );

  if (error) return defaultError(error, resp);
  resp.send(data);
});

// returns a genre with a specific id
app.get("/api/genres/:ref", async (req, resp) => {
  const params = req.params.ref.toLowerCase();
  const { data, error } = await supabase
    .from("Genres")
    .select(
      `
        *, 
        Eras(*)
      `
    )
    .match({ genreId: params });
  if (error) return defaultError(error, resp);
  resp.send(data);
});

/*
Randy... Why? This request made me almost lose my mind... Supabases documentation is trash

/api/genres/painting/ref Returns the genres used in a given painting (order by genreName in
ascending order), e.g., /api/genres/painting/408

I'm basing it on this assumption: This question is passing in the "paintingId" and were matching it, and returning all genres used with a specific paintingId
*/
app.get("/api/genres/painting/:ref", async (req, resp) => {
  const params = req.params.ref.toLowerCase();
  const { data, error } = await supabase
    .from("PaintingGenres")
    .select(
      `
        Genres!inner (
          *,
          Eras (*)
        )
      `
    )
    .match({ paintingId: params })
    .order("Genres(genreName)", { ascending: true });

  if (error) return defaultError(error, resp);
  resp.send(data);
});

// returns all paintings for a given genre, sorted by yearOfWork
// no idea why this wasn't sorting without .rpc
app.get("/api/paintings/genre/:ref", async (req, resp) => {
  const params = req.params.ref.toLowerCase();

  if (isNaN(params)) {
    return resp.status(400).json({
      error: true,
      message: "parameter MUST BE A NUMBER",
      details: "NO VALID # PROVIDED",
    });
  }

  const { data, error } = await supabase.rpc("execute_sql", {
    query: `
      SELECT DISTINCT p."paintingId", p."title", p."yearOfWork"
      FROM "Paintings" p
      JOIN "PaintingGenres" pg ON p."paintingId" = pg."paintingId"
      WHERE pg."genreId" = ${params}
      ORDER BY p."yearOfWork" ASC;
    `,
  });

  if (error) return defaultError(error, resp);
  resp.send(data);
});

// returns the paintings for a given era, sorted by yearOfWork
app.get("/api/paintings/era/:ref", async (req, resp) => {
  const params = req.params.ref.toLowerCase();
  const { data, error } = await supabase
    .from("PaintingGenres")
    .select(
      `

        Paintings!inner(
          paintingId,
          title,
          yearOfWork
        ),
        Genres!inner(eraId)
      `
    )
    .eq("Genres.eraId", params)
    .order("Paintings(yearOfWork)", { ascending: true });

  if (error) return defaultError(error, resp);
  resp.send(data);
});

// returns genre name and # of paintings for each genre, sorted by # of paintings, (least to most)
// This query is impossible without RPC
// the following is the backend query made:
app.get("/api/counts/genres", async (req, resp) => {
  const { data, error } = await supabase.rpc("execute_sql", {
    query: `
        SELECT g."genreName", COUNT(p."paintingId") as "paintingsForGenre"
        FROM "Paintings" p
        JOIN "PaintingGenres" pg ON p."paintingId" = pg."paintingId"
        JOIN "Genres" g ON g."genreId" = pg."genreId"
        GROUP BY g."genreName"
        ORDER BY "paintingsForGenre" ASC;
      `,
  });
  if (error) return defaultError(error, resp);
  resp.send(data);
});

// returns the artist name, firstName space lastName, & the number of paintings for each artist,
// sorted by # of paintings, most to fewest
app.get("/api/counts/artists", async (req, resp) => {
  const { data, error } = await supabase.rpc("execute_sql", {
    query: `
      SELECT (a."firstName" || ' ' || a."lastName") as "artistName", COUNT(p."paintingId") as "paintingCount"
      FROM "Artists" a
      JOIN "Paintings" p ON p."artistId" = a."artistId"
      GROUP BY "artistName"
      ORDER BY "paintingCount" DESC;
    `,
  });
  if (error) return defaultError(error, resp);
  resp.send(data);
});

// returns the genre name,and the number of paintings for each genre,
// sorted by the number of paintings DESC
// for genres having over some number of paintings
// eg. /api/counts/topgenres/20
// would show painting counts for those genres with more than 20 paintings

// WARNING, WOULD NEVER GET DEPLOYED IN REAL LIFE
// PARAMS IS NOT FILTERED
app.get("/api/counts/topgenres/:ref", async (req, resp) => {
  const param = parseInt(req.params.ref); // sanitizing

  if (isNaN(param)) {
    return resp.status(400).json({
      error: true,
      message: "parameter MUST BE A NUMBER",
      details: "NO VALID # PROVIDED",
    });
  }

  const { data, error } = await supabase.rpc("execute_sql", {
    query: `
          SELECT g."genreName", COUNT(p."paintingId") as "paintingsForGenre"
          FROM "Paintings" p
          JOIN "PaintingGenres" pg ON p."paintingId" = pg."paintingId"
          JOIN "Genres" g ON g."genreId" = pg."genreId"
          GROUP BY g."genreName"
          HAVING COUNT(p."paintingId") >= ${param}
          ORDER BY "paintingsForGenre" DESC;
        `,
  });
  if (error) return defaultError(error, resp);
  resp.send(data);
});

// setting up port listening
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// creating a default error if it happens
function defaultError(error, resp) {
  return resp.status(500).json({
    error: true,
    message: error.message,
    details: "Invalid search param for this type",
  });
}
