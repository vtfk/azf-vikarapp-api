/**
 * Valid statuses for E18 jobs
 */
type E18Status = 
  'waiting' |
  'running' |
  'suspended' |
  'completed' |
  'retired' |
  'failed'


/**
 * Valid statuses for E18 operations
 */
type E18OperationStatus = 'completed' | 'failed'

interface E18File {
  /** Name of the file */
  fileName: string;
  /** Base64 encoding the file */
  content: string;
}

interface E18CompletedOperation {
  status: 'completed'
  status: E18OperationStatus,
  message?: string,
  data?: Object|string|boolean,
  createdTimestamp: Date
}

interface E18FailedOperation {
  status: 'failed'
  status: E18OperationStatus,
  message?: string,
  error?: Object|string|boolean,
  createdTimestamp: Date
}

type E18Operation = E18CompletedOperation | E18FailedOperation


interface E18Task {
  /** ID of the task */
  _id: string,
  /** The system the task is using for execution */
  system: string,
  /** The system method being used */
  method: string,
  /* Status of the job */
  status: E18Status,
  /** Task group, tasks in the same group will run in parallel */
  group?: string,
  /** What is the task regarding? (Do not add personal information here) */
  regarding?: string,
  /** At what time should this task be delayed until? */
  delayUntil?: Date,
  /** Tags for the task */
  tags?: string[],
  /** A way of mapping data from previous tasks into this data, please see the documentation... */
  dataMapping?: string | string[],
  /**
   * The data that should be sent to the system
   * Can be combined with previous task results by using dataMapping
   */
  data?: Object|string|number|boolean
  /** Files */
  files: E18File[],
  /** The results after E18 has run the task */
  operations: E18Operation[],
  /** The number of retries E18 has done running the task */
  retries: Number
}

/**
 * E18 Job
 * https://github.com/vtfk/E18-api
 */
interface E18Job {
  /** The system this job is for */
  system: string,
  /** The type of job this is for the system */
  type: string,
  /**
   * Does this system/job run because of a specific project?
   * This can be used for statistics purposes
  */
  projectId: number,
  /** Should E18 run the job or is it just for statistics? */
  e18: boolean = false,
  /** The status of the job */
  status: E18Status,
  /** The tasks for the job */
  tasks: E18Task[]
}