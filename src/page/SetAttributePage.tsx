import { Dispatch, FormEventHandler, MouseEventHandler, SetStateAction, useCallback, useEffect, useState } from 'react';
import { faBan, faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, ThemeProvider } from '@mui/material';
import { cloneDeep } from 'lodash';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';

import {
  deleteImgAPI,
  panelDatasetAPI,
  panelDatasetZipAPI,
  postGoldenAPI,
  postTrainNgAPI,
  postTrainPassAPI,
  postValNgAPI,
  postValPassAPI,
} from '../APIPath';
import DivEllipsisWithTooltip from '../components/DivEllipsisWithTooltip';
import DraggableCard from '../components/DraggableCard';
import LoadingOverlay from '../components/LoadingOverlay';
import ConfirmDialog from '../dialog/ConfirmDialog';
import RatioDialog from '../dialog/RatioDialog';
import { theme } from './ProjectPage';

import {
  AttributeType,
  PageKeyType,
  PanelDatasetPromiseType,
  PanelDatasetType,
  PanelInfoType,
  PassNgType,
  ProjectDataType,
  TrainValType,
} from './type';

const getCheckStatus = (data: Record<string, PanelDatasetType>) => {
  return Object.keys(data)
    .map((item) => data[item].check)
    .reduce((a, b) => a && b);
};

type SetAttributePagePageProps = {
  currentProject: ProjectDataType;
  setPageKey: Dispatch<SetStateAction<PageKeyType>>;
};

const SetAttributePage = (props: SetAttributePagePageProps) => {
  const { currentProject, setPageKey } = props;
  const [somethingChange, setSomethingChange] = useState(false);
  const [tempComp, setTempComp] = useState('');
  const [tempLight, setTempLight] = useState('');
  const [openConfirmLeaveDialog, setOpenConfirmLeaveDialog] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [openRatioDialog, setOpenRatioDialog] = useState(false);
  const [panelInfo, setPanelInfo] = useState<PanelInfoType>();
  const [panelDataset, setPanelDataset] = useState<Record<string, Record<string, PanelDatasetType>>>();
  const [panelDatasetSecond, setPanelDatasetSecond] = useState<Record<string, PanelDatasetType>>();
  const [panelDatasetThird, setPanelDatasetThird] = useState<PanelDatasetType>();
  const [selectComp, setSelectComp] = useState('');
  const [selectLight, setSelectLight] = useState('');
  const [trainPass, setTrainPass] = useState(0);
  const [trainNg, setTrainNg] = useState(0);
  const [valPass, setValPass] = useState(0);
  const [valNg, setValNg] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const trainNum = panelDatasetThird ? panelDatasetThird.train.PASS.length + panelDatasetThird.train.NG.length : 0;
  const valNum = panelDatasetThird ? panelDatasetThird.val.PASS.length + panelDatasetThird.val.NG.length : 0;
  const goldenNum = panelDatasetThird?.train?.GOLDEN ? panelDatasetThird.train.GOLDEN.length : 0;

  const confirmAttribute: AttributeType = {
    title: 'Save changes',
    desc: `Deleted items <b>can't be restored</b>.<br/>Are you sure to save changes?`,
  };

  const confirmLeaveAttribute: AttributeType = {
    title: 'Confirm leave',
    desc: 'You have unsaved changes.<br/>Are you sure to leave?',
  };

  const fetchPanelDataset = useCallback((exportId: string) => {
    setIsLoading(true);
    fetch(panelDatasetAPI(exportId))
      .then((res) => res.json())
      .then((data) => {
        setPanelInfo(data.info);
        setPanelDataset(data.data);
      })
      .catch((err) => {
        const msg = err?.response?.detail?.[0]?.msg || '';
        const loc = err?.response?.detail?.[0]?.loc || [];
        console.log(`API error: ${msg} [${loc.join(', ')}]`);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const SaveFetchPanelDataset = useCallback(
    (exportId: string) => {
      fetch(panelDatasetAPI(exportId))
        .then((res) => res.json())
        .then((data) => {
          setPanelInfo(data.info);
          setPanelDataset(data.data);
          if (selectComp) setPanelDatasetSecond(data.data[selectComp]);
          if (selectComp && selectLight) setPanelDatasetThird(data.data[selectComp][selectLight]);
        })
        .catch((err) => {
          const msg = err?.response?.detail?.[0]?.msg || '';
          const loc = err?.response?.detail?.[0]?.loc || [];
          console.log(`API error: ${msg} [${loc.join(', ')}]`);
        });
    },
    [selectComp, selectLight],
  );

  const onDragEnd = (event: any) => {
    if (!panelDatasetThird) return;

    const { source, destination } = event;
    if (!destination) return;

    const sourceTrainVal: TrainValType = source.droppableId.split('_')[0];
    const sourceType: PassNgType = source.droppableId.split('_')[1];
    const destTrainVal: TrainValType = destination.droppableId.split('_')[0];
    const destType: PassNgType = destination.droppableId.split('_')[1];

    // 當golden貼上第二項時觸發
    if ((destType === 'GOLDEN' && panelDatasetThird.train.GOLDEN?.length) || 0 > 1)
      return alert('Golden can be just one. Please remove the original one.');

    let newPanelDataset = cloneDeep(panelDatasetThird);

    // 從source剪下被拖曳的元素
    const sourceList = newPanelDataset[sourceTrainVal]?.[sourceType] || [];
    const [removeItem] = sourceList.splice(source.index, 1);

    // 在destination位置貼上被拖曳的元素
    const pasteType = newPanelDataset[destTrainVal]?.[destType] || [];
    pasteType.splice(destination.index, 0, removeItem);

    newPanelDataset[destTrainVal][destType] = pasteType;

    setPanelDatasetThird(newPanelDataset);
    setSomethingChange(true);
  };

  const putResource = async (exportId: string, url: string, method: 'PUT' | 'DELETE', putList: string[]): Promise<any> => {
    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        export_uuid: exportId,
        image_uuid_list: putList,
      }),
    });

    if (!response.ok) {
      throw new Error(`PUT request for resource ${url} failed`);
    }

    return response.json();
  };

  const adjustRatio: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    if (!panelDatasetThird) return;
    const passArray = [...panelDatasetThird.train.PASS, ...panelDatasetThird.val.PASS];
    const ngArray = [...panelDatasetThird.train.NG, ...panelDatasetThird.val.NG];

    let newPanelDataset = cloneDeep(panelDatasetThird);
    newPanelDataset.train.PASS = passArray.slice(0, Math.ceil((passArray.length * trainPass) / 100));
    newPanelDataset.val.PASS = passArray.slice(Math.ceil((passArray.length * trainPass) / 100), passArray.length);
    newPanelDataset.train.NG = ngArray.slice(0, Math.ceil((ngArray.length * trainNg) / 100));
    newPanelDataset.val.NG = ngArray.slice(Math.ceil((ngArray.length * trainNg) / 100), ngArray.length);

    setPanelDatasetThird(newPanelDataset);
    setSomethingChange(true);
  };

  const saveData = (exportId: string | null, data?: PanelDatasetType) => {
    if (!exportId) return;
    if (!data) return;
    setIsLoading(true);

    const APIList: PanelDatasetPromiseType = [
      { path: postTrainPassAPI, method: 'PUT', data: data?.train.PASS.map((item) => item.image_uuid) || [] },
      { path: postTrainNgAPI, method: 'PUT', data: data?.train.NG.map((item) => item.image_uuid) || [] },
      { path: postValPassAPI, method: 'PUT', data: data?.val.PASS.map((item) => item.image_uuid) || [] },
      { path: postValNgAPI, method: 'PUT', data: data?.val.NG.map((item) => item.image_uuid) || [] },
      { path: postGoldenAPI, method: 'PUT', data: data?.train.GOLDEN?.map((item) => item.image_uuid) || [] },
      { path: deleteImgAPI, method: 'DELETE', data: data?.train.DELETE?.map((item) => item.image_uuid) || [] },
    ];

    const putPromises = APIList.filter((item) => item.data.length > 0).map((resource) => {
      return putResource(exportId, resource.path, resource.method, resource.data);
    });

    Promise.all(putPromises)
      .then(() => {
        SaveFetchPanelDataset(exportId);
      })
      .catch((err) => {
        const msg = err?.response?.detail?.[0]?.msg || '';
        const loc = err?.response?.detail?.[0]?.loc || [];
        console.log(`API error: ${msg} [${loc.join(', ')}]`);
      })
      .finally(() => setIsLoading(false));
  };

  const handleConfirm: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    saveData(currentProject.export_uuid, panelDatasetThird);
    setOpenConfirmDialog(false);
    setSomethingChange(false);
    setTempComp('');
    setTempLight('');
  };

  const handleConfirmLeave: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();

    if (panelDataset && tempComp) {
      setSelectComp(tempComp);
      setPanelDatasetSecond(panelDataset[tempComp]);
      setPanelDatasetThird(undefined);
      setSelectLight('');
      setTempLight('');
    }

    if (panelDatasetSecond && tempLight) {
      setSelectLight(tempLight);
      setPanelDatasetThird(panelDatasetSecond[tempLight]);
    }

    setOpenConfirmLeaveDialog(false);
    setSomethingChange(false);
    setTempComp('');
    setTempLight('');
  };

  const ConvertPanelDataset = (projectId: string, exportId: string | null) => {
    if (!exportId) return;
    const postData = {
      project_uuid: projectId,
      export_uuid: exportId,
    };

    fetch(panelDatasetZipAPI, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
    })
      .then(() => {
        setPageKey('LoadingPanelDatasetZipPage');
      })
      .catch((err) => {
        const msg = err?.response?.detail?.[0]?.msg || '';
        const loc = err?.response?.detail?.[0]?.loc || [];
        console.log(`API error: ${msg} [${loc.join(',')}]`);
      });
  };

  useEffect(() => {
    if (currentProject.export_uuid) fetchPanelDataset(currentProject.export_uuid);
  }, [currentProject.export_uuid, fetchPanelDataset]);

  // 離開網站的提醒
  useEffect(() => {
    if (!somethingChange) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      return 'sure?';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [somethingChange]);

  return (
    <ThemeProvider theme={theme}>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="attribute-page-container">
          <div className="title-container">
            <span className="title-style">
              Classify Product of&nbsp;
              <div className="title-name">
                <DivEllipsisWithTooltip>{currentProject.project_name}</DivEllipsisWithTooltip>
              </div>
            </span>
            <div className="lower-right-button-container">
              <span className="title-count">
                <span>
                  ( Train_PASS: <b className={!panelInfo?.train.PASS ? 'red-font' : ''}>{panelInfo?.train.PASS || 0}</b>、
                </span>
                <span>
                  Train_NG: <b className={!panelInfo?.train.NG ? 'red-font' : ''}>{panelInfo?.train.NG || 0}</b>、
                </span>
                <span>
                  Val_PASS: <b className={!panelInfo?.val.PASS ? 'red-font' : ''}>{panelInfo?.val.PASS || 0}</b>、
                </span>
                <span>
                  Val_NG: <b className={!panelInfo?.val.NG ? 'red-font' : ''}>{panelInfo?.val.NG || 0}</b> )
                </span>
              </span>
              <Button
                variant="contained"
                className="enlarge-button"
                sx={{ width: 160, fontSize: 16, textTransform: 'none', transition: 'transform 0.2s' }}
                onClick={() => ConvertPanelDataset(currentProject.project_uuid, currentProject.export_uuid)}
                disabled={!panelInfo?.train.PASS || !panelInfo?.train.NG || !panelInfo?.val.PASS || !panelInfo?.val.NG}
              >
                Convert
              </Button>
            </div>
          </div>
          <div className="attribute-page-content">
            <div className="component-container">
              <div className="component-title">Component</div>
              <div className="component-content">
                {panelDataset &&
                  Object.keys(panelDataset).map((comp) => (
                    <div
                      key={comp}
                      className={`component-item ${comp === selectComp ? 'component-item-selected' : ''}`}
                      onClick={() => {
                        if (comp !== selectComp) {
                          if (somethingChange) {
                            setOpenConfirmLeaveDialog(true);
                            setTempComp(comp);
                          } else {
                            setSelectComp(comp);
                            setSelectLight('');
                            setPanelDatasetSecond(panelDataset[comp]);
                            setPanelDatasetThird(undefined);
                          }
                        }
                      }}
                    >
                      {/* //若需勾選時使用
                        <input
                        type="checkbox"
                        name={comp}
                        // value={data.path}
                        checked={false}
                        disabled={!getCheckStatus(panelDataset[comp])}
                        onChange={() => {}}
                      /> */}
                      <div className="component-text">
                        <DivEllipsisWithTooltip>{comp}</DivEllipsisWithTooltip>
                      </div>
                      {getCheckStatus(panelDataset[comp]) ? (
                        <FontAwesomeIcon icon={faCheck} color="green" size="lg" style={{ width: 18 }} />
                      ) : (
                        <FontAwesomeIcon icon={faBan} color="orange" style={{ width: 18 }} />
                      )}
                    </div>
                  ))}
              </div>
            </div>
            <div className="component-container">
              <div className="component-title">Light</div>
              <div className="component-content">
                {panelDatasetSecond &&
                  Object.keys(panelDatasetSecond).map((lightSource) => (
                    <div
                      key={lightSource}
                      className={`component-item ${lightSource === selectLight ? 'component-item-selected' : ''}`}
                      onClick={() => {
                        if (lightSource !== selectLight) {
                          if (somethingChange) {
                            setOpenConfirmLeaveDialog(true);
                            setTempLight(lightSource);
                          } else {
                            setSelectLight(lightSource);
                            setPanelDatasetThird(panelDatasetSecond[lightSource]);
                          }
                        }
                      }}
                    >
                      <div className="component-text">{lightSource}</div>
                      {panelDatasetSecond[lightSource].check ? (
                        <FontAwesomeIcon icon={faCheck} color="green" size="lg" style={{ width: 18 }} />
                      ) : (
                        <FontAwesomeIcon icon={faBan} color="orange" style={{ width: 18 }} />
                      )}
                    </div>
                  ))}
              </div>
            </div>
            <div className="attribute-container">
              <div className="attribute-title">
                <p>
                  Attribute
                  {panelDatasetThird && (
                    <span style={{ fontSize: 14, fontWeight: 400 }}> ※Press alt (or option) key and click to check full size image.</span>
                  )}
                </p>
                {panelDatasetThird && (
                  <div>
                    <Button
                      variant="outlined"
                      className="enlarge-button"
                      sx={{
                        width: 'auto',
                        height: 30,
                        fontSize: 14,
                        padding: '2px 6px',
                        marginRight: '6px',
                        textTransform: 'none',
                        transition: 'transform 0.2s',
                      }}
                      onClick={() => {
                        const trainPass = panelDatasetThird.train.PASS.length;
                        const valPass = panelDatasetThird.val.PASS.length;
                        const trainNg = panelDatasetThird.train.NG.length;
                        const valNg = panelDatasetThird.val.NG.length;
                        setTrainPass(Math.floor((trainPass / (trainPass + valPass)) * 100) || 0);
                        setValPass(100 - Math.floor((trainPass / (trainPass + valPass)) * 100) || 0);
                        setTrainNg(Math.floor((trainNg / (trainNg + valNg)) * 100) || 0);
                        setValNg(100 - Math.floor((trainNg / (trainNg + valNg)) * 100) || 0);
                        setOpenRatioDialog(true);
                      }}
                    >
                      Ratio distribution
                    </Button>
                    <Button
                      variant="contained"
                      className="enlarge-button"
                      sx={{
                        width: 100,
                        height: 30,
                        fontSize: 14,
                        boxShadow: 'none',
                        padding: '2px 6px',
                        textTransform: 'none',
                        transition: 'transform 0.2s',
                      }}
                      onClick={() => setOpenConfirmDialog(true)}
                    >
                      Save
                    </Button>
                  </div>
                )}
              </div>
              {panelDatasetThird && (
                <div className="attribute-content">
                  <div className="train-val-container">
                    <div className="train-val-wrapper">
                      <div className="train-val-title">
                        Train
                        {trainNum < 2 && <span> (Pass + ng need at least two.)</span>}
                      </div>
                      <div className="pass-ng-container">
                        <div className={trainNum < 2 ? 'pass-ng-wrapper-warn' : 'pass-ng-wrapper'}>
                          <div className="pass-ng-title">PASS ({panelDatasetThird.train.PASS.length})</div>
                          <Droppable droppableId="train_PASS">
                            {(provided) => (
                              <div ref={provided.innerRef} {...provided.droppableProps} className="img-container">
                                {panelDatasetThird?.train?.PASS &&
                                  panelDatasetThird.train.PASS.map((img, index) => (
                                    <DraggableCard key={img.image_uuid} index={index} item={img} />
                                  ))}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        </div>
                        <div className={trainNum < 2 ? 'pass-ng-wrapper-warn' : 'pass-ng-wrapper'}>
                          <div className="pass-ng-title">NG ({panelDatasetThird.train.NG.length})</div>
                          <Droppable droppableId="train_NG">
                            {(provided) => (
                              <div ref={provided.innerRef} {...provided.droppableProps} className="img-container">
                                {panelDatasetThird?.train?.NG &&
                                  panelDatasetThird.train.NG.map((img, index) => (
                                    <DraggableCard key={img.image_uuid} index={index} item={img} />
                                  ))}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        </div>
                      </div>
                    </div>
                    <div className="train-val-wrapper">
                      <div className="train-val-title">
                        Val
                        {valNum < 1 && <span> (Pass + ng need at least one.)</span>}
                      </div>
                      <div className="pass-ng-container">
                        <div className={valNum < 1 ? 'pass-ng-wrapper-warn' : 'pass-ng-wrapper'}>
                          <div className="pass-ng-title">PASS ({panelDatasetThird.val.PASS.length})</div>
                          <Droppable droppableId="val_PASS">
                            {(provided) => (
                              <div ref={provided.innerRef} {...provided.droppableProps} className="img-container">
                                {panelDatasetThird?.val?.PASS &&
                                  panelDatasetThird.val.PASS.map((img, index) => (
                                    <DraggableCard key={img.image_uuid} index={index} item={img} />
                                  ))}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        </div>
                        <div className={valNum < 1 ? 'pass-ng-wrapper-warn' : 'pass-ng-wrapper'}>
                          <div className="pass-ng-title">NG ({panelDatasetThird.val.NG.length})</div>
                          <Droppable droppableId="val_NG">
                            {(provided) => (
                              <div ref={provided.innerRef} {...provided.droppableProps} className="img-container">
                                {panelDatasetThird?.val?.NG &&
                                  panelDatasetThird.val.NG.map((img, index) => (
                                    <DraggableCard key={img.image_uuid} index={index} item={img} />
                                  ))}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="golden-delete-container">
                    <div className="golden-wrapper">
                      <div className="train-val-title">
                        Golden
                        {goldenNum < 1 && <span> (Need one.)</span>}
                      </div>
                      <Droppable droppableId="train_GOLDEN">
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`flex-row-center ${goldenNum < 1 ? 'img-container-shadow-warn' : 'img-container-shadow'}`}
                          >
                            {panelDatasetThird?.train?.GOLDEN &&
                              panelDatasetThird.train.GOLDEN.map((img, index) => (
                                <DraggableCard key={img.image_uuid} index={index} item={img} isGolden />
                              ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                    <div className="delete-wrapper">
                      <div className="train-val-title">Delete</div>
                      <Droppable droppableId="train_DELETE">
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.droppableProps} className="img-container-shadow">
                            {panelDatasetThird?.train?.DELETE &&
                              panelDatasetThird.train.DELETE.map((img, index) => (
                                <DraggableCard key={img.image_uuid} index={index} item={img} />
                              ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <ConfirmDialog {...{ openConfirmDialog, setOpenConfirmDialog, handleConfirm, confirmAttribute }} />
          <ConfirmDialog
            openConfirmDialog={openConfirmLeaveDialog}
            setOpenConfirmDialog={setOpenConfirmLeaveDialog}
            handleConfirm={handleConfirmLeave}
            confirmAttribute={confirmLeaveAttribute}
          />
          <RatioDialog
            {...{
              openRatioDialog,
              setOpenRatioDialog,
              trainPass,
              setTrainPass,
              trainNg,
              setTrainNg,
              valPass,
              setValPass,
              valNg,
              setValNg,
              adjustRatio,
            }}
          />
          <LoadingOverlay show={isLoading} />
        </div>
      </DragDropContext>
    </ThemeProvider>
  );
};

export default SetAttributePage;
