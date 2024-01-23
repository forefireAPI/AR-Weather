<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>DigiPicciu - des Jumeaux Numériquement Augmentés made in Corsica</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #fcec81;
            margin: 0;
            padding: 0;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            text-align: center;
        }

        .logo {
            display: block;
            margin: 20px auto;
        }

        h1 {
            font-size: 24px;
            margin-bottom: 20px;
        }

        h2 {
            font-size: 20px;
            margin-bottom: 10px;
        }

        .subdirectories {
            list-style: none;
            padding: 0;
        }

        .subdirectories li {
            background-color: #ffffff;
            border: 2px solid #dcdcdc;
            margin-bottom: 15px;
            padding: 20px;
            text-align: left;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
            cursor: pointer;
            transition: background-color 0.3s ease;
        }

        .subdirectories li:hover {
            background-color: #f0f0f0;
        }

        .subdirectories a {
            text-decoration: none;
            color: #333;
            font-size: 18px; /* Lien plus gros */
        }

        .subdirectories a:hover {
            color: #007bff;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>DigiPicciu - Jumeaux Numériquement Augmentés </h1>
        <h2>DigiPicciu - Digitally Augmented Twins</h2>
        <p>Made in Corsica - Jean Baptiste Filippi@univ-corse.fr</p>
        <h2>Twin experiences:</h2>
        <ul class="subdirectories">
            <?php
            $directory = './'; // Change to your main directory path
            $subdirectories = glob($directory . '/*', GLOB_ONLYDIR);

            foreach ($subdirectories as $subdirectory) {
                $dirname = str_replace(' ', '_', basename($subdirectory)); // Replace spaces with underscores
                echo '<li><a href="' . $dirname . '">' . str_replace('_', ' ', $dirname) . '</a></li>';
            }
            ?>
            <li><a href="https://zpr.io/7viLg4FUN4S5">Collaborative visit of a wildfire prone landscape (Reality signal)</a></li>
            <li><a href="https://youtu.be/jO9PohD9-e8?si=K5PBQHfWjTFe9iSL">VR Video - The large Chiatra wildire of 03/01/2018 in Corsica (ANR FireCaster) </a></li>
            <li><a href="https://youtu.be/Mr-evTr5wyc?si=-O_AMWKboz6pcOLP">VR Video - Lubrizol accident (Rouen) (ANR FirePlume), what if it has happened the 10/06/2019 (stormy day) </a></li>
            <li><a href="https://youtu.be/ko2n4EOqBfk?si=39xqyv4RSw2GzLCm">VR Video - Emergency weather - chemical explosion in Ajaccio - 19/09/2019 (ANR FireCaster)</a></li>
            <li><a href="https://youtu.be/PCQa7Oxdqzg?si=GWrABjJy5KhCMx4P">VR Video - Weather forecast visualisation from the top of Corsica - 29-30/11/2017 (ANR FireCaster)</a></li>
        </ul>
        <img src="logoSPE.png" alt="CNRS Logo" class="logo" width="800">
    </div>
</body>
</html>

