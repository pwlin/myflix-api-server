CREATE TABLE "movies" (
    "id" INTEGER PRIMARY KEY NOT NULL,
    "imdb" TEXT(20),
    "title" TEXT(255) NOT NULL,
    "originaltitle" TEXT(255),
    "plot" TEXT,
    "folder" TEXT(255) NOT NULL,
    "folderUri" TEXT NOT NULL,
    "filename" TEXT(255) NOT NULL,
    "filenameUri" TEXT(255) NOT NULL,
    "cover" TEXT,
    "tagline" TEXT(255),
    "year" TEXT(10),
    "rating" TEXT(10),
    "trailer" TEXT,
    "certification" TEXT(7),
    "runtime" TEXT(10),
    "genre" TEXT,
    "actor" TEXT,
    "director" TEXT,
    "country" TEXT,
    "studio" TEXT,
    "resolution" TEXT(10),
    "hassubtitle" TEXT(3),
    "language" TEXT,
    "durationminutes" TEXT(20),
    "filesize" TEXT(10),
    "filesizebytes" TEXT(100),
    "isnew" TEXT(3)
);

CREATE INDEX "idx_movies_genre" ON "movies" ("genre" ASC);
CREATE INDEX "idx_movies_isnew" ON "movies" ("isnew" ASC);
