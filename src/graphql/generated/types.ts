export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: string; output: string; }
  JSON: { input: any; output: any; }
};

export type Ad = {
  altText?: Maybe<Scalars['String']['output']>;
  clicks: Scalars['Int']['output'];
  createdAt: Scalars['DateTime']['output'];
  endDate: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  imageUrl: Scalars['String']['output'];
  impressions: Scalars['Int']['output'];
  isActive: Scalars['Boolean']['output'];
  linkUrl: Scalars['String']['output'];
  placements: Array<AdPlacement>;
  startDate: Scalars['DateTime']['output'];
  tier: AdTier;
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type AdPlacement =
  | 'CALENDAR_SIDEBAR'
  | 'EVENT_SIDEBAR'
  | 'FOOTER_BANNER'
  | 'HERO_BANNER'
  | 'IN_FEED'
  | 'RESULTS_BANNER';

export type AdTier =
  | 'BRONZE'
  | 'GOLD'
  | 'SILVER';

export type AdminRegistrationInput = {
  bibNumber?: InputMaybe<Scalars['String']['input']>;
  dateOfBirth: Scalars['DateTime']['input'];
  email: Scalars['String']['input'];
  firstName: Scalars['String']['input'];
  gender: Gender;
  lastName: Scalars['String']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  raceId: Scalars['ID']['input'];
  status?: InputMaybe<RegistrationStatus>;
};

export type AnalyticsDayStat = {
  count: Scalars['Int']['output'];
  date: Scalars['String']['output'];
  uniqueCount: Scalars['Int']['output'];
};

export type AnalyticsEntityStat = {
  count: Scalars['Int']['output'];
  entityId: Scalars['String']['output'];
  name: Scalars['String']['output'];
  slug?: Maybe<Scalars['String']['output']>;
  uniqueCount: Scalars['Int']['output'];
};

export type AnalyticsLoginStat = {
  email: Scalars['String']['output'];
  lastLogin: Scalars['DateTime']['output'];
  loginCount: Scalars['Int']['output'];
  name?: Maybe<Scalars['String']['output']>;
  userId?: Maybe<Scalars['String']['output']>;
};

export type AnalyticsRegistrationByEventStat = {
  count: Scalars['Int']['output'];
  eventId: Scalars['String']['output'];
  eventName: Scalars['String']['output'];
  slug?: Maybe<Scalars['String']['output']>;
};

export type AnalyticsRegistrationStatusStat = {
  count: Scalars['Int']['output'];
  status: Scalars['String']['output'];
};

export type AnalyticsSearchStat = {
  count: Scalars['Int']['output'];
  query: Scalars['String']['output'];
};

export type AnalyticsStats = {
  newVisitorCount: Scalars['Int']['output'];
  newVisitorsPerDay: Array<AnalyticsDayStat>;
  recentLogins: Array<AnalyticsLoginStat>;
  registrationsByEvent: Array<AnalyticsRegistrationByEventStat>;
  registrationsByStatus: Array<AnalyticsRegistrationStatusStat>;
  topEvents: Array<AnalyticsEntityStat>;
  topFavorites: Array<AnalyticsEntityStat>;
  topRaces: Array<AnalyticsEntityStat>;
  topSearches: Array<AnalyticsSearchStat>;
  topUsers: Array<AnalyticsUserStat>;
  totalRegistrations: Scalars['Int']['output'];
  totalUniqueVisitors: Scalars['Int']['output'];
  totalUsers: Scalars['Int']['output'];
  unverifiedUsersCount: Scalars['Int']['output'];
  userGrowthPerDay: Array<AnalyticsDayStat>;
  verifiedUsersCount: Scalars['Int']['output'];
  viewsPerDay: Array<AnalyticsDayStat>;
};

export type AnalyticsUserStat = {
  count: Scalars['Int']['output'];
  email: Scalars['String']['output'];
  name?: Maybe<Scalars['String']['output']>;
  userId: Scalars['String']['output'];
};

export type AuthPayload = {
  accessToken: Scalars['String']['output'];
  user: User;
};

export type Checkpoint = {
  assignedJudges: Array<JudgeUser>;
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  raceEventId: Scalars['ID']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type CheckpointBasic = {
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  orderIndex: Scalars['Int']['output'];
};

export type CheckpointTime = {
  checkpointId: Scalars['ID']['output'];
  checkpointName: Scalars['String']['output'];
  orderIndex: Scalars['Int']['output'];
  timestamp: Scalars['DateTime']['output'];
};

export type CheckpointWithRace = {
  distance?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  orderIndex: Scalars['Int']['output'];
  race: RaceWithEvent;
  raceId: Scalars['ID']['output'];
};

export type Competition = {
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type CreateAdInput = {
  altText?: InputMaybe<Scalars['String']['input']>;
  endDate: Scalars['DateTime']['input'];
  imageUrl: Scalars['String']['input'];
  linkUrl: Scalars['String']['input'];
  placements?: InputMaybe<Array<AdPlacement>>;
  startDate: Scalars['DateTime']['input'];
  tier: AdTier;
  title: Scalars['String']['input'];
};

export type CreateCheckpointInput = {
  name: Scalars['String']['input'];
  raceEventId: Scalars['ID']['input'];
};

export type CreateCompetitionInput = {
  name: Scalars['String']['input'];
};

export type CreateOrganizerInput = {
  contactEmail?: InputMaybe<Scalars['String']['input']>;
  contactPhone?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  organizerSite?: InputMaybe<Scalars['String']['input']>;
};

export type CreateRaceEventInput = {
  country?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  eventName: Scalars['String']['input'];
  gallery?: InputMaybe<Array<Scalars['String']['input']>>;
  mainImage?: InputMaybe<Scalars['String']['input']>;
  organizerId?: InputMaybe<Scalars['ID']['input']>;
  registrationSite?: InputMaybe<Scalars['String']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
  socialMedia?: InputMaybe<Array<Scalars['String']['input']>>;
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
  type: RaceEventType;
};

export type CreateRaceInput = {
  competitionId?: InputMaybe<Scalars['ID']['input']>;
  elevation?: InputMaybe<Scalars['Float']['input']>;
  endDateTime?: InputMaybe<Scalars['DateTime']['input']>;
  gpsFile?: InputMaybe<Scalars['String']['input']>;
  length: Scalars['Float']['input'];
  raceEventId: Scalars['ID']['input'];
  raceName?: InputMaybe<Scalars['String']['input']>;
  registrationEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  registrationSite?: InputMaybe<Scalars['String']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
  startDateTime: Scalars['DateTime']['input'];
  startLocation: Scalars['String']['input'];
};

export type CreateReportInput = {
  entityId: Scalars['String']['input'];
  entityName: Scalars['String']['input'];
  entityType: Scalars['String']['input'];
  fields: Array<Scalars['String']['input']>;
  message?: InputMaybe<Scalars['String']['input']>;
  reporterEmail?: InputMaybe<Scalars['String']['input']>;
};

export type CreateTrainingEventInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  eventName: Scalars['String']['input'];
  type: RaceEventType;
};

export type Favorite = {
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  race: Race;
  raceId: Scalars['ID']['output'];
};

export type ForgotPasswordInput = {
  email: Scalars['String']['input'];
};

export type ForgotPasswordPayload = {
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type Gender =
  | 'FEMALE'
  | 'MALE';

export type ImportDuplicateCheck = {
  existingEventSlugs: Array<Scalars['String']['output']>;
  existingRaceSlugs: Array<Scalars['String']['output']>;
};

export type ImportRaceInput = {
  competitionName?: InputMaybe<Scalars['String']['input']>;
  elevation?: InputMaybe<Scalars['Float']['input']>;
  endDateTime?: InputMaybe<Scalars['String']['input']>;
  eventSlug: Scalars['String']['input'];
  length: Scalars['Float']['input'];
  raceName: Scalars['String']['input'];
  registrationEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
  startDateTime: Scalars['String']['input'];
  startLocation?: InputMaybe<Scalars['String']['input']>;
};

export type ImportResult = {
  errors: Array<Scalars['String']['output']>;
  failed: Scalars['Int']['output'];
  imported: Scalars['Int']['output'];
  success: Scalars['Boolean']['output'];
  updated: Scalars['Int']['output'];
};

export type JudgeUser = {
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name?: Maybe<Scalars['String']['output']>;
};

export type LoginInput = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type Mutation = {
  addFavorite: Favorite;
  adminRegisterForRace: RaceRegistration;
  assignBibNumber: RaceRegistration;
  assignJudge: User;
  cancelMyRegistration: RaceRegistration;
  createAd: Ad;
  createCheckpoint: Checkpoint;
  createCompetition: Competition;
  createOrganizer: Organizer;
  createRace: Race;
  createRaceEvent: RaceEvent;
  createTrainingEvent: RaceEvent;
  createTrainingRace: Race;
  deleteAd: Scalars['Boolean']['output'];
  deleteCheckpoint: Scalars['Boolean']['output'];
  deleteCompetition: Scalars['Boolean']['output'];
  deleteRace: Scalars['Boolean']['output'];
  deleteRaceEvent: Scalars['Boolean']['output'];
  deleteRegistration: Scalars['Boolean']['output'];
  deleteTiming: Scalars['Boolean']['output'];
  deleteTrainingEvent: Scalars['Boolean']['output'];
  deleteTrainingRace: Scalars['Boolean']['output'];
  deleteUser: Scalars['Boolean']['output'];
  duplicateRace: Race;
  duplicateRaceEvent: RaceEvent;
  forgotPassword: ForgotPasswordPayload;
  importEvents: ImportResult;
  importRaces: ImportResult;
  login: AuthPayload;
  loginWithGoogle: AuthPayload;
  logout: Scalars['Boolean']['output'];
  recordAdClick: Scalars['Boolean']['output'];
  recordAdImpression: Scalars['Boolean']['output'];
  recordTime: Timing;
  refresh: AuthPayload;
  register: AuthPayload;
  registerForRace: RaceRegistration;
  removeFavorite: Scalars['Boolean']['output'];
  resendVerificationEmail: ResendVerificationPayload;
  resetPassword: ResetPasswordPayload;
  setRaceCheckpoints: Array<RaceCheckpoint>;
  submitReport: Report;
  trackEvent: Scalars['Boolean']['output'];
  unassignJudge: User;
  updateAd: Ad;
  updateCheckpoint: Checkpoint;
  updateEmailPreferences: User;
  updateRace: Race;
  updateRaceEvent: RaceEvent;
  updateRegistration: RaceRegistration;
  updateRegistrationStatus: RaceRegistration;
  updateReportStatus: Report;
  updateTiming: Timing;
  updateTrainingEvent: RaceEvent;
  updateTrainingRace: Race;
  updateUserRole: User;
  verifyEmail: VerifyEmailPayload;
};


export type MutationAddFavoriteArgs = {
  raceId: Scalars['ID']['input'];
};


export type MutationAdminRegisterForRaceArgs = {
  input: AdminRegistrationInput;
};


export type MutationAssignBibNumberArgs = {
  bibNumber: Scalars['String']['input'];
  registrationId: Scalars['ID']['input'];
};


export type MutationAssignJudgeArgs = {
  checkpointId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationCancelMyRegistrationArgs = {
  registrationId: Scalars['ID']['input'];
};


export type MutationCreateAdArgs = {
  input: CreateAdInput;
};


export type MutationCreateCheckpointArgs = {
  input: CreateCheckpointInput;
};


export type MutationCreateCompetitionArgs = {
  input: CreateCompetitionInput;
};


export type MutationCreateOrganizerArgs = {
  input: CreateOrganizerInput;
};


export type MutationCreateRaceArgs = {
  input: CreateRaceInput;
};


export type MutationCreateRaceEventArgs = {
  input: CreateRaceEventInput;
};


export type MutationCreateTrainingEventArgs = {
  input: CreateTrainingEventInput;
};


export type MutationCreateTrainingRaceArgs = {
  eventId: Scalars['ID']['input'];
  gpsFile?: InputMaybe<Scalars['String']['input']>;
  raceName?: InputMaybe<Scalars['String']['input']>;
  startDateTime: Scalars['DateTime']['input'];
  startLocation: Scalars['String']['input'];
};


export type MutationDeleteAdArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteCheckpointArgs = {
  checkpointId: Scalars['ID']['input'];
};


export type MutationDeleteCompetitionArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteRaceArgs = {
  raceId: Scalars['ID']['input'];
};


export type MutationDeleteRaceEventArgs = {
  eventId: Scalars['ID']['input'];
};


export type MutationDeleteRegistrationArgs = {
  registrationId: Scalars['ID']['input'];
};


export type MutationDeleteTimingArgs = {
  timingId: Scalars['ID']['input'];
};


export type MutationDeleteTrainingEventArgs = {
  eventId: Scalars['ID']['input'];
};


export type MutationDeleteTrainingRaceArgs = {
  raceId: Scalars['ID']['input'];
};


export type MutationDeleteUserArgs = {
  userId: Scalars['ID']['input'];
};


export type MutationDuplicateRaceArgs = {
  raceId: Scalars['ID']['input'];
};


export type MutationDuplicateRaceEventArgs = {
  eventId: Scalars['ID']['input'];
};


export type MutationForgotPasswordArgs = {
  input: ForgotPasswordInput;
};


export type MutationImportEventsArgs = {
  events: Array<CreateRaceEventInput>;
  override?: InputMaybe<Scalars['Boolean']['input']>;
};


export type MutationImportRacesArgs = {
  override?: InputMaybe<Scalars['Boolean']['input']>;
  races: Array<ImportRaceInput>;
};


export type MutationLoginArgs = {
  input: LoginInput;
};


export type MutationLoginWithGoogleArgs = {
  idToken: Scalars['String']['input'];
};


export type MutationRecordAdClickArgs = {
  adId: Scalars['ID']['input'];
};


export type MutationRecordAdImpressionArgs = {
  adId: Scalars['ID']['input'];
};


export type MutationRecordTimeArgs = {
  input: RecordTimeInput;
};


export type MutationRegisterArgs = {
  input: RegisterInput;
};


export type MutationRegisterForRaceArgs = {
  input: SelfRegistrationInput;
};


export type MutationRemoveFavoriteArgs = {
  raceId: Scalars['ID']['input'];
};


export type MutationResendVerificationEmailArgs = {
  input: ResendVerificationInput;
};


export type MutationResetPasswordArgs = {
  input: ResetPasswordInput;
};


export type MutationSetRaceCheckpointsArgs = {
  input: SetRaceCheckpointsInput;
};


export type MutationSubmitReportArgs = {
  input: CreateReportInput;
};


export type MutationTrackEventArgs = {
  input: TrackEventInput;
};


export type MutationUnassignJudgeArgs = {
  userId: Scalars['ID']['input'];
};


export type MutationUpdateAdArgs = {
  id: Scalars['ID']['input'];
  input: UpdateAdInput;
};


export type MutationUpdateCheckpointArgs = {
  checkpointId: Scalars['ID']['input'];
  input: UpdateCheckpointInput;
};


export type MutationUpdateEmailPreferencesArgs = {
  input: UpdateEmailPreferencesInput;
};


export type MutationUpdateRaceArgs = {
  input: UpdateRaceInput;
  raceId: Scalars['ID']['input'];
};


export type MutationUpdateRaceEventArgs = {
  eventId: Scalars['ID']['input'];
  input: UpdateRaceEventInput;
};


export type MutationUpdateRegistrationArgs = {
  input: UpdateRegistrationInput;
  registrationId: Scalars['ID']['input'];
};


export type MutationUpdateRegistrationStatusArgs = {
  registrationId: Scalars['ID']['input'];
  status: RegistrationStatus;
};


export type MutationUpdateReportStatusArgs = {
  id: Scalars['ID']['input'];
  status: Scalars['String']['input'];
};


export type MutationUpdateTimingArgs = {
  timestamp: Scalars['DateTime']['input'];
  timingId: Scalars['ID']['input'];
};


export type MutationUpdateTrainingEventArgs = {
  eventId: Scalars['ID']['input'];
  input: UpdateTrainingEventInput;
};


export type MutationUpdateTrainingRaceArgs = {
  gpsFile?: InputMaybe<Scalars['String']['input']>;
  raceId: Scalars['ID']['input'];
  raceName?: InputMaybe<Scalars['String']['input']>;
  startDateTime?: InputMaybe<Scalars['DateTime']['input']>;
  startLocation?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpdateUserRoleArgs = {
  role: Role;
  userId: Scalars['ID']['input'];
};


export type MutationVerifyEmailArgs = {
  input: VerifyEmailInput;
};

export type Organizer = {
  contactEmail?: Maybe<Scalars['String']['output']>;
  contactPhone?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  organizerSite?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export type OrganizerInput = {
  contactEmail?: InputMaybe<Scalars['String']['input']>;
  contactPhone?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  organizerSite?: InputMaybe<Scalars['String']['input']>;
};

export type Participant = {
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  rfidTag: Scalars['String']['output'];
};

export type PotentialDuplicate = {
  eventA: SimilarEventInfo;
  eventB: SimilarEventInfo;
  similarity: SimilarityScore;
};

export type Query = {
  activeAdsForPlacement: Array<Ad>;
  ad?: Maybe<Ad>;
  ads: Array<Ad>;
  analyticsStats: AnalyticsStats;
  checkImportDuplicates: ImportDuplicateCheck;
  competitions: Array<Competition>;
  eventCheckpoints: Array<Checkpoint>;
  health: Scalars['String']['output'];
  me?: Maybe<User>;
  myAssignedCheckpoint?: Maybe<CheckpointWithRace>;
  myFavorites: Array<Favorite>;
  myRaceRegistrations: Array<RaceRegistration>;
  myTrainingEvents: Array<RaceEvent>;
  organizer?: Maybe<Organizer>;
  organizers: Array<Organizer>;
  potentialDuplicates: Array<PotentialDuplicate>;
  race?: Maybe<Race>;
  raceCheckpoints: Array<RaceCheckpoint>;
  raceEvent?: Maybe<RaceEvent>;
  raceEvents: Array<RaceEvent>;
  raceRegistration?: Maybe<RaceRegistration>;
  raceRegistrations: Array<RaceRegistration>;
  raceResults: Array<RaceResult>;
  races: Array<Race>;
  recentTimings: Array<Timing>;
  reports: Array<Report>;
  similarEvents: Array<SimilarEvent>;
  userActivity: Array<UserActivityEntry>;
  users: Array<User>;
};


export type QueryActiveAdsForPlacementArgs = {
  placement: AdPlacement;
};


export type QueryAdArgs = {
  id: Scalars['ID']['input'];
};


export type QueryAdsArgs = {
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryAnalyticsStatsArgs = {
  days?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryCheckImportDuplicatesArgs = {
  eventSlugs: Array<Scalars['String']['input']>;
  raceSlugs: Array<Scalars['String']['input']>;
};


export type QueryCompetitionsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryEventCheckpointsArgs = {
  raceEventId: Scalars['ID']['input'];
};


export type QueryOrganizerArgs = {
  id: Scalars['ID']['input'];
};


export type QueryOrganizersArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryPotentialDuplicatesArgs = {
  threshold?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryRaceArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
};


export type QueryRaceCheckpointsArgs = {
  raceId: Scalars['ID']['input'];
};


export type QueryRaceEventArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
};


export type QueryRaceEventsArgs = {
  country?: InputMaybe<Scalars['String']['input']>;
  isTraining?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<RaceEventOrderBy>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  verified?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryRaceRegistrationArgs = {
  id: Scalars['ID']['input'];
};


export type QueryRaceRegistrationsArgs = {
  raceId: Scalars['ID']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<RegistrationStatus>;
};


export type QueryRaceResultsArgs = {
  gender?: InputMaybe<Gender>;
  raceId: Scalars['ID']['input'];
};


export type QueryRacesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<RaceOrderBy>;
  raceEventId?: InputMaybe<Scalars['ID']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryRecentTimingsArgs = {
  checkpointId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryReportsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
};


export type QuerySimilarEventsArgs = {
  eventId: Scalars['ID']['input'];
  threshold?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryUserActivityArgs = {
  date?: InputMaybe<Scalars['String']['input']>;
  userId: Scalars['ID']['input'];
};


export type QueryUsersArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
};

export type Race = {
  competition?: Maybe<Competition>;
  competitionId?: Maybe<Scalars['ID']['output']>;
  createdAt: Scalars['DateTime']['output'];
  elevation?: Maybe<Scalars['Float']['output']>;
  endDateTime?: Maybe<Scalars['DateTime']['output']>;
  gpsFile?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isFavorite: Scalars['Boolean']['output'];
  isRegistered: Scalars['Boolean']['output'];
  length: Scalars['Float']['output'];
  raceCheckpoints: Array<RaceCheckpoint>;
  raceEvent?: Maybe<RaceEvent>;
  raceEventId: Scalars['ID']['output'];
  raceName?: Maybe<Scalars['String']['output']>;
  registrationCount: Scalars['Int']['output'];
  registrationEnabled: Scalars['Boolean']['output'];
  registrationSite?: Maybe<Scalars['String']['output']>;
  slug: Scalars['String']['output'];
  startDateTime: Scalars['DateTime']['output'];
  startLocation: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type RaceCheckpoint = {
  checkpoint: Checkpoint;
  checkpointId: Scalars['ID']['output'];
  createdAt: Scalars['DateTime']['output'];
  distance?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
  orderIndex: Scalars['Int']['output'];
  raceId: Scalars['ID']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type RaceCheckpointOrderInput = {
  checkpointId: Scalars['ID']['input'];
  distance?: InputMaybe<Scalars['Float']['input']>;
  orderIndex: Scalars['Int']['input'];
};

export type RaceEvent = {
  country?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  createdById?: Maybe<Scalars['ID']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  eventName: Scalars['String']['output'];
  gallery: Array<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isTraining: Scalars['Boolean']['output'];
  mainImage?: Maybe<Scalars['String']['output']>;
  organizer?: Maybe<Organizer>;
  races: Array<Race>;
  registrationSite?: Maybe<Scalars['String']['output']>;
  slug: Scalars['String']['output'];
  socialMedia: Array<Scalars['String']['output']>;
  tags: Array<Scalars['String']['output']>;
  type: RaceEventType;
  updatedAt: Scalars['DateTime']['output'];
  verified: Scalars['Boolean']['output'];
};

export type RaceEventBasic = {
  eventName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  slug: Scalars['String']['output'];
};

export type RaceEventOrderBy =
  | 'CREATED_AT_ASC'
  | 'CREATED_AT_DESC'
  | 'EVENT_NAME_ASC'
  | 'EVENT_NAME_DESC';

export type RaceEventType =
  | 'OCR'
  | 'ROAD'
  | 'TRAIL';

export type RaceOrderBy =
  | 'CREATED_AT_ASC'
  | 'CREATED_AT_DESC'
  | 'START_DATE_ASC'
  | 'START_DATE_DESC';

export type RaceRegistration = {
  bibNumber?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  dateOfBirth: Scalars['DateTime']['output'];
  email: Scalars['String']['output'];
  firstName: Scalars['String']['output'];
  gender: Gender;
  id: Scalars['ID']['output'];
  lastName: Scalars['String']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  participant?: Maybe<Participant>;
  phone?: Maybe<Scalars['String']['output']>;
  race: Race;
  status: RegistrationStatus;
  updatedAt: Scalars['DateTime']['output'];
  user?: Maybe<User>;
};

export type RaceResult = {
  checkpointTimes: Array<CheckpointTime>;
  finishTime?: Maybe<Scalars['DateTime']['output']>;
  registration: RegistrationBasic;
  startTime?: Maybe<Scalars['DateTime']['output']>;
  totalTime?: Maybe<Scalars['Float']['output']>;
};

export type RaceWithEvent = {
  id: Scalars['ID']['output'];
  length: Scalars['Float']['output'];
  raceEvent: RaceEventBasic;
  raceName?: Maybe<Scalars['String']['output']>;
  startDateTime: Scalars['DateTime']['output'];
};

export type RecordTimeInput = {
  bibNumber: Scalars['String']['input'];
};

export type RegisterInput = {
  email: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  password: Scalars['String']['input'];
};

export type RegistrationBasic = {
  bibNumber?: Maybe<Scalars['String']['output']>;
  firstName: Scalars['String']['output'];
  gender: Gender;
  id: Scalars['ID']['output'];
  lastName: Scalars['String']['output'];
};

export type RegistrationStatus =
  | 'CANCELLED'
  | 'CONFIRMED'
  | 'PAID'
  | 'PENDING';

export type Report = {
  createdAt: Scalars['DateTime']['output'];
  entityId: Scalars['String']['output'];
  entityName: Scalars['String']['output'];
  entityType: Scalars['String']['output'];
  fields: Array<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  message?: Maybe<Scalars['String']['output']>;
  reporterEmail?: Maybe<Scalars['String']['output']>;
  status: Scalars['String']['output'];
};

export type ResendVerificationInput = {
  email: Scalars['String']['input'];
};

export type ResendVerificationPayload = {
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type ResetPasswordInput = {
  newPassword: Scalars['String']['input'];
  token: Scalars['String']['input'];
};

export type ResetPasswordPayload = {
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type Role =
  | 'ADMIN'
  | 'STANDARD';

export type SelfRegistrationInput = {
  dateOfBirth: Scalars['DateTime']['input'];
  firstName: Scalars['String']['input'];
  gender: Gender;
  lastName: Scalars['String']['input'];
  phone?: InputMaybe<Scalars['String']['input']>;
  raceId: Scalars['ID']['input'];
};

export type SetRaceCheckpointsInput = {
  checkpoints: Array<RaceCheckpointOrderInput>;
  raceId: Scalars['ID']['input'];
};

export type SimilarEvent = {
  event: SimilarEventInfo;
  similarity: SimilarityScore;
};

export type SimilarEventInfo = {
  earliestDate?: Maybe<Scalars['DateTime']['output']>;
  eventName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  location?: Maybe<Scalars['String']['output']>;
  slug: Scalars['String']['output'];
  type: RaceEventType;
};

export type SimilarityScore = {
  date: Scalars['Int']['output'];
  location: Scalars['Int']['output'];
  name: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type Timing = {
  checkpoint: CheckpointBasic;
  checkpointId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  raceId: Scalars['ID']['output'];
  registration: RegistrationBasic;
  registrationId: Scalars['ID']['output'];
  timestamp: Scalars['DateTime']['output'];
};

export type TrackEventInput = {
  entityId?: InputMaybe<Scalars['String']['input']>;
  entityType?: InputMaybe<Scalars['String']['input']>;
  metadata?: InputMaybe<Scalars['JSON']['input']>;
  type: Scalars['String']['input'];
  userId?: InputMaybe<Scalars['String']['input']>;
  visitorId?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateAdInput = {
  altText?: InputMaybe<Scalars['String']['input']>;
  endDate?: InputMaybe<Scalars['DateTime']['input']>;
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  linkUrl?: InputMaybe<Scalars['String']['input']>;
  placements?: InputMaybe<Array<AdPlacement>>;
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
  tier?: InputMaybe<AdTier>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateCheckpointInput = {
  name?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateEmailPreferencesInput = {
  emailSubMonthly: Scalars['Boolean']['input'];
  emailSubNewEvents: Scalars['Boolean']['input'];
  emailSubNews: Scalars['Boolean']['input'];
};

export type UpdateRaceEventInput = {
  country?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  eventName?: InputMaybe<Scalars['String']['input']>;
  gallery?: InputMaybe<Array<Scalars['String']['input']>>;
  mainImage?: InputMaybe<Scalars['String']['input']>;
  organizer?: InputMaybe<OrganizerInput>;
  organizerId?: InputMaybe<Scalars['ID']['input']>;
  registrationSite?: InputMaybe<Scalars['String']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
  socialMedia?: InputMaybe<Array<Scalars['String']['input']>>;
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
  type?: InputMaybe<RaceEventType>;
  verified?: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateRaceInput = {
  competitionId?: InputMaybe<Scalars['ID']['input']>;
  elevation?: InputMaybe<Scalars['Float']['input']>;
  endDateTime?: InputMaybe<Scalars['DateTime']['input']>;
  gpsFile?: InputMaybe<Scalars['String']['input']>;
  length?: InputMaybe<Scalars['Float']['input']>;
  raceEventId?: InputMaybe<Scalars['ID']['input']>;
  raceName?: InputMaybe<Scalars['String']['input']>;
  registrationEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  registrationSite?: InputMaybe<Scalars['String']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
  startDateTime?: InputMaybe<Scalars['DateTime']['input']>;
  startLocation?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateRegistrationInput = {
  bibNumber?: InputMaybe<Scalars['String']['input']>;
  dateOfBirth?: InputMaybe<Scalars['DateTime']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  gender?: InputMaybe<Gender>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<RegistrationStatus>;
};

export type UpdateTrainingEventInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  eventName?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<RaceEventType>;
};

export type User = {
  assignedCheckpointId?: Maybe<Scalars['ID']['output']>;
  createdAt: Scalars['DateTime']['output'];
  email: Scalars['String']['output'];
  emailSubMonthly: Scalars['Boolean']['output'];
  emailSubNewEvents: Scalars['Boolean']['output'];
  emailSubNews: Scalars['Boolean']['output'];
  emailVerified: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  isParticipant: Scalars['Boolean']['output'];
  name?: Maybe<Scalars['String']['output']>;
  role: Role;
  updatedAt: Scalars['DateTime']['output'];
};

export type UserActivityEntry = {
  createdAt: Scalars['DateTime']['output'];
  entityId?: Maybe<Scalars['String']['output']>;
  entityName?: Maybe<Scalars['String']['output']>;
  entityType?: Maybe<Scalars['String']['output']>;
  searchQuery?: Maybe<Scalars['String']['output']>;
  type: Scalars['String']['output'];
};

export type VerifyEmailInput = {
  token: Scalars['String']['input'];
};

export type VerifyEmailPayload = {
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type EventsForSitemapQueryVariables = Exact<{ [key: string]: never; }>;


export type EventsForSitemapQuery = { raceEvents: Array<{ slug: string, updatedAt: string }> };

export type RacesForSitemapQueryVariables = Exact<{ [key: string]: never; }>;


export type RacesForSitemapQuery = { races: Array<{ slug: string, updatedAt: string }> };
