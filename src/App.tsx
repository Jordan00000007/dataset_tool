import { useCallback, useEffect, useState } from 'react';
import './App.css';
import { Tooltip } from '@mui/material';

import { datasetToolProjectAPI } from './APIPath';
import LoadingOverlay from './components/LoadingOverlay';
import logo from './image/Dataset_Tool_Logo_white.svg';
import ChooseProductPage from './page/ChooseProductPage';
import ExportProductPage from './page/ExportProductPage';
import LoadingCopyToLocalPage from './page/LoadingCopyToLocalPage';
import LoadingPanelDatasetZipPage from './page/LoadingPanelDatasetZipPage';
import ProjectPage from './page/ProjectPage';
import SetAttributePage from './page/SetAttributePage';

import { PageKeyType, ProjectDataType } from './page/type';

export const initialProjectState: ProjectDataType = {
  project_uuid: '',
  dataset_uuid: '',
  export_uuid: '',
  project_name: '',
  project_status: {
    init: false,
    export: {},
    copy_to_local: {
      status: '',
      detail: { panel_path: '', process: '' },
      total_request: 0,
      finish_request: 0,
      panel_error: [],
      format_error: [],
    },
    generate_zip: {
      status: '',
      detail: { step: 0, process: '' },
      total_step: 0,
      finish_step: 0,
    },
  },
  annotation: '',
  create_time: 0,
};

function App() {
  const [pageKey, setPageKey] = useState<PageKeyType>('ProjectPage');
  const [currentProject, setCurrentProject] = useState<ProjectDataType>(initialProjectState);
  const [projectData, setProjectData] = useState<ProjectDataType[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProject = useCallback((projectId: string) => {
    setIsLoading(true);
    fetch(datasetToolProjectAPI)
      .then((res) => res.json())
      .then((data) => {
        setProjectData(data);
        if (projectId) {
          setCurrentProject((state) => data.find((item: ProjectDataType) => item.project_uuid === state.project_uuid));
        }
      })
      .catch((err) => {
        const msg = err?.response?.detail?.[0]?.msg || '';
        const loc = err?.response?.detail?.[0]?.loc || [];
        console.log(`API error: ${msg} [${loc.join(', ')}]`);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // 禁止使用者使用右鍵
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    document.addEventListener('contextmenu', handleContextMenu);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  return (
    <div className="app-container">
      <div className="header">
        <div className="header-text" onClick={() => window.location.reload()}>
          <Tooltip enterDelay={500} enterNextDelay={500} title="Home" arrow>
            <div className="flex-row-center">
              <img src={logo} alt="logo icon" style={{ width: 38, height: 38 }} />
              {/* <FontAwesomeIcon icon={faScrewdriverWrench} size="sm" color="#fff" /> */}
              &nbsp;Dataset Tool
            </div>
          </Tooltip>
        </div>
      </div>
      <div className="page-container">
        {pageKey === 'ProjectPage' && <ProjectPage {...{ setPageKey, currentProject, setCurrentProject, projectData, fetchProject }} />}
        {pageKey === 'ChooseProductPage' && <ChooseProductPage {...{ setPageKey, currentProject }} />}
        {pageKey === 'LoadingCopyToLocalPage' && <LoadingCopyToLocalPage {...{ setPageKey, currentProject }} />}
        {pageKey === 'ExportProductPage' && <ExportProductPage {...{ setPageKey, currentProject, fetchProject }} />}
        {pageKey === 'SetAttributePage' && <SetAttributePage {...{ setPageKey, currentProject }} />}
        {pageKey === 'LoadingPanelDatasetZipPage' && <LoadingPanelDatasetZipPage {...{ setPageKey, currentProject }} />}
      </div>
      <LoadingOverlay show={isLoading} />
    </div>
  );
}

export default App;
