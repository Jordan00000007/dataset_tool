//const localhost = 'http://172.16.93.107';
//const wsLocalhost = 'ws://172.16.93.107';

const localhost = 'http://10.204.16.52';
const wsLocalhost = 'ws://10.204.16.52';

const port = '';
const nginx_proxy = '/inmfft';
const apiv1 = '/api/v1';
const dataConvert_server = '/dataConvert';
const restfulv1 = '/rest/v1';

// ProjectPage
export const datasetToolProjectAPI = `${localhost}${port}${nginx_proxy}${apiv1}/datasetToolProject`;

export const projectCoverAPI = (project_uuid: string, image_max_length?: number) =>
  `${localhost}${port}${nginx_proxy}${dataConvert_server}${restfulv1}/project/cover?project_uuid=${project_uuid}${
    image_max_length ? '&image_max_length=' + image_max_length : ''
  }`;

// ChooseProductPage
export const dataSourceAPI = (dataPath?: string) =>
  `${localhost}${port}${nginx_proxy}${dataConvert_server}${restfulv1}/dataSource?boardSnCountFilter=2${
    dataPath ? '&dataPath=' + dataPath : ''
  }`;

export const copyToLocalAPI = `${localhost}${port}${nginx_proxy}${apiv1}/copyToLocal`;

export const copyToLocalWs = (project_uuid: string) =>
  `${wsLocalhost}${port}${nginx_proxy}${apiv1}/projectStatus/copyToLocal?project_uuid=${project_uuid}`;

// ExportProductPage
export const panelSourceAPI = (project_uuid: string, dataset_uuid: string) =>
  `${localhost}${port}${nginx_proxy}${apiv1}/panelSource?project_uuid=${project_uuid}&dataset_uuid=${dataset_uuid}`;

export const panelSourceSourceAPI = `${localhost}${port}${nginx_proxy}${apiv1}/panelSource/source`;

export const panelSourceExportAPI = `${localhost}${port}${nginx_proxy}${apiv1}/panelSource/export`;

export const panelSourceViewAPI = (dataset_uuid: string, source_uuid: string) =>
  `${localhost}${port}${nginx_proxy}${apiv1}/panelSource/view?dataset_uuid=${dataset_uuid}&source_uuid=${source_uuid}`;

export const datasetImgAPI = (image_uuid: string, image_max_length?: number) =>
  `${localhost}${port}${nginx_proxy}${dataConvert_server}${restfulv1}/dataset/format/image?image_uuid=${image_uuid}${
    image_max_length ? '&image_max_length=' + image_max_length : ''
  }`;

// SetAttributePage
export const panelDatasetAPI = (export_uuid: string) =>
  `${localhost}${port}${nginx_proxy}${apiv1}/panelDataset?export_uuid=${export_uuid}&random_result=true`;

export const postGoldenAPI = `${localhost}${port}${nginx_proxy}${apiv1}/panelDataset/golden`;

export const postTrainPassAPI = `${localhost}${port}${nginx_proxy}${apiv1}/panelDataset/train/pass`;

export const postTrainNgAPI = `${localhost}${port}${nginx_proxy}${apiv1}/panelDataset/train/ng`;

export const postValPassAPI = `${localhost}${port}${nginx_proxy}${apiv1}/panelDataset/val/pass`;

export const postValNgAPI = `${localhost}${port}${nginx_proxy}${apiv1}/panelDataset/val/ng`;

export const deleteImgAPI = `${localhost}${port}${nginx_proxy}${apiv1}/panelDataset/image`;

export const panelDatasetZipAPI = `${localhost}${port}${nginx_proxy}${apiv1}/panelDataset/zip`;

export const downloadDatasetAPI = (export_uuid: string) =>
  `${localhost}${port}${nginx_proxy}${dataConvert_server}${restfulv1}/dataset/export/download?export_uuid=${export_uuid}`;

export const generateZipWs = (project_uuid: string) =>
  `${wsLocalhost}${port}${nginx_proxy}${apiv1}/projectStatus/generateZip?project_uuid=${project_uuid}`;
