use serde::{Serialize, Deserialize};
use chrono::{DateTime, Utc};

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum ScreenplayFormatId {
    SceneHeader1,
    SceneHeader2,
    SceneHeaderLocation,
    Action,
    Character,
    Parenthetical,
    Dialogue,
    Transition,
    Basmala,
    Unknown,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Character {
    pub id: String,
    pub name: String,
    pub role: String,
    #[serde(rename = "dialogueCount")]
    pub dialogue_count: u32,
    #[serde(rename = "wordCount")]
    pub word_count: u32,
    #[serde(rename = "sceneCount")]
    pub scene_count: u32,
    #[serde(rename = "dialogueShare")]
    pub dialogue_share: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DialogueLine {
    pub id: String,
    #[serde(rename = "characterId")]
    pub character_id: String,
    pub text: String,
    #[serde(rename = "sceneNumber")]
    pub scene_number: u32,
    #[serde(rename = "pageNumber")]
    pub page_number: u32,
    #[serde(rename = "isEdited")]
    pub is_edited: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Sprint {
    pub id: String,
    #[serde(rename = "userId")]
    pub user_id: String,
    pub duration: u32, // in minutes
    #[serde(rename = "isActive")]
    pub is_active: bool,
    #[serde(rename = "startedAt")]
    pub started_at: DateTime<Utc>,
    #[serde(rename = "endedAt")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ended_at: Option<DateTime<Utc>>,
    #[serde(rename = "pausedAt")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub paused_at: Option<DateTime<Utc>>,
    #[serde(rename = "wordsWritten")]
    pub words_written: u32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct StashItem {
    pub id: String,
    #[serde(rename = "userId")]
    pub user_id: String,
    pub text: String,
    #[serde(rename = "type")]
    pub item_type: ScreenplayFormatId,
    #[serde(rename = "wordCount")]
    pub word_count: u32,
    #[serde(rename = "createdAt")]
    pub created_at: DateTime<Utc>,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq)]
#[serde(rename_all = "PascalCase")]
pub enum ErrorCheckType {
    Format,
    Consistency,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq)]
#[serde(rename_all = "PascalCase")]
pub enum ErrorSeverity {
    Error,
    Warning,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Location {
    pub line: u32,
    pub column: u32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ErrorCheck {
    pub id: String,
    #[serde(rename = "type")]
    pub error_type: ErrorCheckType,
    pub severity: ErrorSeverity,
    pub description: String,
    pub location: Location,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub suggestion: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ScriptStructure {
    pub acts: Vec<Act>,
    pub scenes: Vec<Scene>,
    pub bookmarks: Vec<Bookmark>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Act {
    pub id: String,
    pub title: String,
    pub scenes: Vec<Scene>,
    #[serde(rename = "startLine")]
    pub start_line: u32,
    #[serde(rename = "endLine")]
    pub end_line: u32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Scene {
    pub id: String,
    pub number: u32,
    pub title: String,
    pub location: String,
    pub setting: String,
    #[serde(rename = "startLine")]
    pub start_line: u32,
    #[serde(rename = "endLine")]
    pub end_line: u32,
    pub characters: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Bookmark {
    pub id: String,
    pub title: String,
    pub line: u32,
    #[serde(rename = "createdAt")]
    pub created_at: DateTime<Utc>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SceneData {
    #[serde(rename = "sceneNumber")]
    pub scene_number: String,
    #[serde(rename = "sceneInfo")]
    pub scene_info: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ClassifiedLine {
    pub line: String,
    pub format: ScreenplayFormatId,
    #[serde(rename = "sceneData")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scene_data: Option<SceneData>,
}
