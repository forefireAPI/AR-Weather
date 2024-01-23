<!DOCTYPE html>
<html>
<head>
    <title>Scene exports - VTK</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            background-color: #252525; /* Dark background for a 3D/Wildfire theme */
            color: #f0f0f0;
        }
        h1 {
            color: #ff5733; /* Fire-like color for the title */
            text-align: center;
            margin-top: 30px;
            font-size: 2.5em;
        }
        table {
            width: 80%;
            margin: 30px auto;
            border-collapse: collapse;
        }
        th, td {
            padding: 15px;
            border: 1px solid #444; /* Darker border for a classy look */
            text-align: center;
            font-size: 1.1em;
        }
        th {
            background-color: #333; /* Dark header for contrast */
            color: #ffcc00; /* Gold color for a touch of elegance */
        }
        tr:nth-child(even) {
            background-color: #303030; /* Slightly lighter row for readability */
        }
        tr:hover {
            background-color: #404040; /* Hover effect for interactivity */
        }
        a {
            color: #ffcc00; /* Matching the header's gold color */
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <h1>FireCaster Augmented</h1>
    <table>
        <tr>
            <th>Experiences</th>
        </tr>
        <?php
        $dir = ".";
        if (is_dir($dir)) {
            if ($dh = opendir($dir)) {
                while (($file = readdir($dh)) !== false) {
                    if ($file != "." && $file != ".." && pathinfo($file, PATHINFO_EXTENSION) == "glb") {
                        echo "<tr><td><a href='demo.html?file=$file'>$file</a></td></tr>";
                    }
                    if ($file != "." && $file != ".." && pathinfo($file, PATHINFO_EXTENSION) == "gltf") {
                        echo "<tr><td><a href='demo.html?file=$file'>$file</a></td></tr>";
                    }
                }
                closedir($dh);
            }
        }
        ?>
    </table>
</body>
</html>
