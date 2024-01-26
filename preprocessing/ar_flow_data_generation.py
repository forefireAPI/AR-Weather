import json
import math
import vtk
from vtk.util.numpy_support import vtk_to_numpy
import xarray as xr
import zipfile
import io
import numpy as np
 
def limit_float_precision(obj):
    if isinstance(obj, float):
        return round(obj, 2)
    elif isinstance(obj, dict):
        return {k: limit_float_precision(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [limit_float_precision(x) for x in obj]
    return obj

class CustomEncoder(json.JSONEncoder):
    def iterencode(self, o, _one_shot=False):
        if isinstance(o, float):
            return format(o, '.2f')
        return super(CustomEncoder, self).iterencode(o, _one_shot)
# Parameters

def arrayTo2DJSON(altitude, u, v, origin, extent, filename="None"):
    ni,nj = np.shape(altitude)
    json_structure = {
        "origin": {
          "x": origin[0],
          "y": origin[1]
        },
        "extents": {
          "width": extent[0],
          "height": extent[1]
        },
        "dimension": {
            "ni": ni,
            "nj": nj
        },
        "data": {
            "altitude": limit_float_precision(altitude.tolist()),
            "U": limit_float_precision(u.tolist()),
            "V": limit_float_precision(v.tolist())
        }
    }
    
    # Convert to JSON string
    json_string = json.dumps(json_structure, cls=CustomEncoder, separators=(',', ':'))
    
    if (filename is not None):    
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'a', zipfile.ZIP_DEFLATED, False) as zip_file:
            zip_file.writestr('data.json', json_string)
        
        # Écrire le fichier ZIP sur le disque
        with open(filename, 'wb') as f:
            f.write(zip_buffer.getvalue())
    
   

def arrayTo2DTJSON(altitude, u, v, resolution, tlist, filename="None"):
    ni, nj = np.shape(altitude)
    json_structure = {

        "resolution": 1200,
        "value_bounds": {
            "U":limit_float_precision((float(np.min(u)),float(np.max(u)))),
            "V":limit_float_precision((float(np.min(v)),float(np.max(v)))),
            "altitude":limit_float_precision((float(np.min(altitude)),float(np.max(altitude))))
            },
  
        "dimension": {
            "ni": ni,
            "nj": nj
        },
        "altitude": limit_float_precision(altitude.tolist()),
        "data": {}
    }
    
    # Adding time frames data to JSON structure
    for i, tf in enumerate(tlist):
        json_structure["data"][str(tf)] = {
            "U": limit_float_precision(np.fliplr(u[i]).tolist()),
            "V": limit_float_precision(np.fliplr(v[i]).tolist())
        }
    # Convert to JSON string
    # Assuming CustomEncoder is defined elsewhere
    json_string = json.dumps(json_structure, cls=CustomEncoder, separators=(',', ':'))
    
    # Check if filename is not 'None'
    if filename != "None":    
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'a', zipfile.ZIP_DEFLATED, False) as zip_file:
            zip_file.writestr('data.json', json_string)
        
        # Write the ZIP file to disk
        with open(filename, 'wb') as f:
            f.write(zip_buffer.getvalue())
    return json_structure
    
def genSinMatrices():
    ni = 500
    nj = 500
    radius = 10
    
    # Initialize the altitude array
    altitude = [[0 for _ in range(nj)] for _ in range(ni)]
    U = [[0 for _ in range(nj)] for _ in range(ni)]
    V = [[1 for _ in range(nj)] for _ in range(ni)]
    
    # Calculate the altitude values
    for i in range(ni):
        for j in range(nj):
            x_scaled = (i / ni - 0.5) * 2 * radius
            y_scaled = (j / nj - 0.5) * 2 * radius
            x_s= (i / ni - 0.5) * 2 
            y_s = (j / nj - 0.5) * 2 
            
            altitude[i][j] = math.sin(x_scaled) * math.sin(y_scaled)
            U[i][j] =  (x_s+0.5) *10
            V[i][j] =  (y_s+0.5) *10
    return altitude,U,V


def read_vtk_file(file_path):
    reader = vtk.vtkXMLStructuredGridReader()
    reader.SetFileName(file_path)
    reader.Update()

    # Extracting data from the reader
    data = reader.GetOutput()

    return data

def getShape(vtk_data):
    # Get extents
    extents = vtk_data.GetExtent()
 
    # Calculate the shape
    NI = extents[1] - extents[0] + 1
    NJ = extents[3] - extents[2] + 1
    NK = extents[5] - extents[4] + 1
   
    # Get origin
    origin = vtk_data.GetPoint(0)

    # Calculate bounds
    left_point_coords = vtk_data.GetPoint(vtk_data.FindPoint(extents[0], extents[2], extents[4]))
    right_point_coords = vtk_data.GetPoint(vtk_data.FindPoint(extents[1], extents[2], extents[4]))
    bottom_point_coords = vtk_data.GetPoint(vtk_data.FindPoint(extents[0], extents[2], extents[4]))
    top_point_coords = vtk_data.GetPoint(vtk_data.FindPoint(extents[0], extents[3], extents[4]))
  
    # Create the dictionary
    shape_dict = {
        "shape": (NI, NJ, NK),
        "origin": origin,
        "bounds": {
            "top": top_point_coords[1],
            "bottom": origin[1],
            "left": origin[0],
            "right": right_point_coords[0]
        }
    }

    return shape_dict




def extract_last_number(filepath):
    import re

    # Extraire le nom de base du fichier (sans le chemin)
    base = os.path.basename(filepath)
    
    # Utiliser une expression régulière pour trouver tous les nombres dans le nom de fichier
    numbers = re.findall(r'\d+', base)
    
    # Renvoyer le dernier nombre trouvé, converti en entier
    return int(numbers[-1]) if numbers else 0

import glob,os
from datetime import datetime, timedelta
#str(ds.time.data[0])
import pandas as pd

def FFMNHVTKtoTimedArraync():
    VTKINPUTPATTERN = "/Users/filippi_j/data/2024/barbaggio/MNHfields/output.full.*.vts"
    
    refTimeString = "2024-01-03T00:00:00.000000000" 
    contours1  = glob.glob(VTKINPUTPATTERN)
    
    selectionSorted =  sorted(contours1, key=extract_last_number)[::20]
    
    refTime = datetime.fromisoformat(refTimeString[:26])
    
    filetimes = [refTime + timedelta(seconds=extract_last_number(filePath)) for filePath in selectionSorted]
    time_index = pd.to_datetime(filetimes)
    
    vtk_data = read_vtk_file(selectionSorted[0])
    shape_info = getShape(vtk_data)
    NI, NJ, NK = shape_info["shape"]
    # Create DataArrays
    dims = ('time', 'NI', 'NJ')
    coords = {'time': time_index, 'NI': range(NI), 'NJ': range(NJ)}
    XarrayU = xr.DataArray(name="U", dims=dims, coords=coords)
    XarrayV = xr.DataArray(name="V", dims=dims, coords=coords)
    XarrayW = xr.DataArray(name="W", dims=dims, coords=coords)
    XarrayTKE = xr.DataArray(name="TKE", dims=dims, coords=coords)
    
    
    
    for filePath, filetime in zip(selectionSorted, filetimes):
        seconds = extract_last_number(filePath)
        filetime = refTime + timedelta(seconds=seconds)
        
        vtk_data = read_vtk_file(filePath)
        shape_info = getShape(vtk_data)
        NI, NJ, NK = shape_info["shape"]
    
        UVW = vtk_to_numpy(vtk_data.GetPointData().GetArray("Wind"))
        U = np.reshape(UVW[:,0], (NK, NJ, NI))[0,:,:]
        V = np.reshape(UVW[:,1], (NK, NJ, NI))[0,:,:]
        W = np.reshape(UVW[:,2], (NK, NJ, NI))[0,:,:]
        TKE = np.reshape(vtk_to_numpy(vtk_data.GetPointData().GetArray("TKE")), (NK, NJ, NI))[0,:,:]
    
        XarrayU.loc[filetime, :, :] = U
        XarrayV.loc[filetime, :, :] = V
        XarrayW.loc[filetime, :, :] = W
        XarrayTKE.loc[filetime, :, :] = TKE
    
    # Combine into a single dataset
    ds = xr.Dataset({'U': XarrayU, 'V': XarrayV, 'W': XarrayW, 'TKE': XarrayTKE})
    
    # Save dataset
    ds.to_netcdf('/Users/filippi_j/data/2024/barbaggio/MNHfields/compilX.nc')
    return ds


        



def oneSubsetVtkFiletodata(filePath= "/Users/filippi_j/data/2023/prunelli/ARexperience/20200809/test/test_0.vts"):
    vtk_data = read_vtk_file(filePath)
    shape_info = getShape(vtk_data)
    NI, NJ, NK = shape_info["shape"]
    
    altitude_array = np.flipud(np.rot90(np.reshape(vtk_to_numpy(vtk_data.GetPointData().GetArray("altitude")), (NI, NJ))))
    U_array = np.flipud(np.rot90(np.reshape(vtk_to_numpy(vtk_data.GetPointData().GetArray("U")), (NI, NJ))))
    V_array = np.flipud(np.rot90(np.reshape(vtk_to_numpy(vtk_data.GetPointData().GetArray("V")), (NI, NJ))))
    
    
    
    origin = (shape_info["origin"][0] ,shape_info["origin"][1])
    extent = ( shape_info["bounds"]["right"] - shape_info["bounds"]["left"], shape_info["bounds"]["top"] - shape_info["bounds"]["bottom"])
    
    print(origin, extent)
    json_data = arrayTo2DJSON(altitude_array, U_array, V_array, origin, extent)#,filename = "/Users/filippi_j/Volumes/firecaster/www/arfields/data.zip")

    dataset_path = "/Users/filippi_j/data/2023/prunelli/prunelli15020200809_l0_UVWTKE5000063000.nc"
    ds = xr.open_dataset(dataset_path)
    fakeA = ds.altitude * 0.001


    
    # Determine start and end times if not provided
    start_time = ds['time'].data.min()
    end_time = ds['time'].data.max()
    sliceT = 24
    RR=altitude_array[:-1,:-1]
    
    arrayTo2DTJSON(RR, tt(ds.U[::sliceT,:,:].data), tt(ds.V[::sliceT,:,:].data), origin, extent, range(0,3600*24,3600*2), filename="/Users/filippi_j/soft/firefront/tools/AR/timed.zip")

def medseaData(filePath= "/Users/filippi_j/data/2023/oursins/MEDSEA2019.nc"):
    ds = xr.open_dataset(filePath)
    arrayTo2DTJSON(np.ones((1016, 380))*0, rr(ds.uo[:,0,:,:]*10), rr(ds.vo[:,0,:,:]*10), [0,0], [10.15,5.685], range(0,3600*24,3600*2), filename="/Users/filippi_j/soft/firefront/tools/AR/timed.zip")

def tt(A):
    B = np.empty_like(A)
    for i in range(A.shape[0]):
        B[i] = np.flipud(np.rot90(A[i]))
    return B

def rr(A,tkey='time', lonkey='lon', latkey='lat'):
    tX = A.fillna(0)
    tX = tX.transpose(tkey, lonkey, latkey)
    
    return tX.data

def menorData(infilePath="/Users/filippi_j/data/2023/oursins/champs_meno_BE201905.nc",altBinOut='/Users/filippi_j/soft/ARflow/med_currents_AR/elevation.bin',jsonZipBinOut="/Users/filippi_j/soft/ARflow/med_currents_AR/stimed.zip"):
    ds = xr.open_dataset(infilePath)
    
    elevation = ds.H0.data
    
    resolution = 1200
    floorValue = np.nanmax(elevation).astype(np.uint16)
    

    
    array_uint16 = floorValue-(np.flipud(np.abs(elevation).astype(np.uint16)))
    print(np.max(array_uint16),np.min(array_uint16))
    with open(altBinOut, 'wb') as file:
        array_uint16.tofile(file)
       
    
    sliceT = 32
    tlist = list((ds.time[::sliceT].data.astype(int)/1000000).astype(int))
    print("timeOK")
    U = rr(ds.UZ[::sliceT,-2,:,:],"time","ni_u","nj_u")
    shapeU = np.shape(U)
    V = rr(ds.VZ[::sliceT,-2,:,:],"time","ni_v","nj_v")
    print("VOK",np.max(V),np.min(V))

    Z0 = np.ones( shapeU[1:])*floorValue

  
    
    
    return arrayTo2DTJSON( Z0, U, -V, resolution, tlist, filename=jsonZipBinOut)
    
import cfgrib
def compilMNH2Json():          
    infilePath="/Users/filippi_j/data/2024/barbaggio/MNHfields/FCAST.3.FIRE.001.nc"
    flowfilePath="/Users/filippi_j/data/2024/barbaggio/MNHfields/compil.nc"
    altBinOut='/Users/filippi_j/soft/ARflow/wind_barbaggio_AR/bbelevation.bin'
    jsonZipBinOut="/Users/filippi_j/soft/ARflow/wind_barbaggio_AR/bbtimed2.zip"
    
    dsX = FFMNHVTKtoTimedArraync()
    
    land = xr.open_dataset(infilePath)   
    ds = xr.open_dataset(flowfilePath) 
    elevation = land.ZS.data[1:,1:]
    resolution = 80
    floorValue = np.nanmax(elevation).astype(np.uint16)
    
        
    array_uint16 = np.flipud(np.abs(elevation).astype(np.uint16))
                             
    print(np.max(array_uint16),np.min(array_uint16))
    with open(altBinOut, 'wb') as file:
        array_uint16.tofile(file)
       
    
    sliceT = 1
    tlist = list((ds.time[::sliceT].data.astype(int)/1000000).astype(int))
    
    
    RDU = ds.U[::sliceT,:,:] 
    RDV = ds.V[::sliceT,:,:]
    RDTKE = ds.TKE[::sliceT,:,:]
    
   # RDU[:] = dsX.U[0,:,:] 
   # RDV[:] = dsX.V[0,:,:] 
   # RDTKE[:] = dsX.TKE[0,:,:] 
    
    RDU[0].plot()
    TKE = rr(RDTKE,"time","NJ","NI")
    U = rr(RDU,"time","NJ","NI")  
    V = rr(RDV,"time","NJ","NI") 
    
    shapeU = np.shape(U)
    
    #TKE = rr(ds.U[::sliceT,:,:],"time","NI","NJ")
    #U = rr(ds.U[::sliceT,:,:],"time","NI","NJ")  
    #V = rr(ds.V[::sliceT,:,:],"time","NI","NJ") 
    
    
    print("VOK",np.max(V),np.min(V))
    
    Z0 = array_uint16
    
    print("UOK",np.shape(Z0), shapeU)
    altBin=np.flipud(np.rot90(array_uint16.astype(np.float32)))
    
    print("SHOPA Uint",np.shape(altBin), shapeU, np.min(Z0),np.max(Z0),np.min(altBin),np.max(altBin))
    
    A = arrayTo2DTJSON( altBin+10, U, -V, resolution, tlist, filename=jsonZipBinOut)
    
    
def cep2Json(gribfile="/Users/filippi_j/data/2024/barbaggio/MNHfields/cep.FC00Z.00"):
# Open the dataset
    ds = cfgrib.open_datasets(gribfile, engine='cfgrib')
    return ds

ds = cep2Json()



#compilMNH2Json()
#menorData()
    
    







