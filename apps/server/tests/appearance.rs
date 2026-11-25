//! How the apps look for each account: its theme and accent (docs/API.md,
//! "Appearance").

mod common;

use axum::http::StatusCode;
use serde_json::{Value, json};

use common::TestApp;

#[tokio::test]
async fn an_account_keeps_its_theme_and_accent_for_every_app() {
    let app = TestApp::new().await;
    let admin = app.setup_admin().await;
    let (bob, bob_id) = app.user(&admin, "bob", json!({})).await;

    // Nothing chosen: dark, with its own accent, as Pley always looked.
    let me = app.get("/api/auth/me", &bob).await;
    assert_eq!(me.body["theme"], json!("dark"));
    assert_eq!(me.body["accent"], Value::Null);

    // The web changes either alone.
    let chosen = app.patch("/api/me", &bob, json!({"theme": "midnight"})).await;
    assert_eq!(chosen.status, StatusCode::OK, "{}", chosen.text());
    assert_eq!(chosen.body["theme"], json!("midnight"));
    assert_eq!(chosen.body["accent"], Value::Null);
    let chosen = app.patch("/api/me", &bob, json!({"accent": "amber"})).await;
    assert_eq!(chosen.body["theme"], json!("midnight"), "the theme stays");
    assert_eq!(chosen.body["accent"], json!("amber"));
    for wrong in
        [json!({"theme": "sepia"}), json!({"theme": "Dark"}), json!({"accent": "#ff0000"}), json!({"accent": 3})]
    {
        let reply = app.patch("/api/me", &bob, wrong.clone()).await;
        assert!(reply.status.is_client_error(), "{wrong}: {}", reply.status);
    }
    assert_eq!(app.get("/api/auth/me", &bob).await.body["accent"], json!("amber"), "a refusal changes nothing");

    // An app sets both at once with the play scope; what it leaves out is
    // the default.
    let (bob_app, _) = app.app_token(bob_id, "library play").await;
    let chosen = app.put("/api/me/appearance", &bob_app, json!({"theme": "light", "accent": "violet"})).await;
    assert_eq!(chosen.status, StatusCode::OK, "{}", chosen.text());
    assert_eq!(chosen.body["theme"], json!("light"));
    assert_eq!(chosen.body["accent"], json!("violet"));
    let wrong = app.put("/api/me/appearance", &bob_app, json!({"theme": "system", "accent": "red"})).await;
    assert_eq!(wrong.status, StatusCode::BAD_REQUEST);
    assert_eq!(app.get("/api/auth/me", &bob).await.body["theme"], json!("light"), "neither is kept");
    let reset = app.put("/api/me/appearance", &bob_app, json!({})).await;
    assert_eq!(reset.body["theme"], json!("dark"));
    assert_eq!(reset.body["accent"], Value::Null);
    let (library_only, _) = app.app_token(bob_id, "library").await;
    assert_eq!(
        app.put("/api/me/appearance", &library_only, json!({"theme": "light"})).await.status,
        StatusCode::FORBIDDEN
    );

    // Each account's own.
    app.put("/api/me/appearance", &bob_app, json!({"theme": "system", "accent": "teal"})).await;
    assert_eq!(app.get("/api/auth/me", &admin).await.body["theme"], json!("dark"));
}
