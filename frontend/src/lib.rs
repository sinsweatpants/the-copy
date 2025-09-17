use leptos::ev::SubmitEvent;
use leptos::{event_target_value, *};
use reqwasm::http::Request;
use serde::{Deserialize, Serialize};

const fn backend_base_url() -> &'static str {
    match option_env!("BACKEND_URL") {
        Some(url) => url,
        None => "http://127.0.0.1:3000",
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
struct LoginRequest {
    email: String,
    password: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
struct AuthResponse {
    token: String,
    user: PublicUser,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
struct PublicUser {
    id: String,
    email: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
struct Screenplay {
    id: String,
    title: String,
    description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
struct ScreenplayRequest {
    title: String,
    description: String,
}

#[component]
pub fn App() -> impl IntoView {
    let (email, set_email) = create_signal(String::new());
    let (password, set_password) = create_signal(String::new());
    let (token, set_token) = create_signal(Option::<String>::None);
    let (screenplays, set_screenplays) = create_signal(Vec::<Screenplay>::new());
    let (error, set_error) = create_signal(Option::<String>::None);
    let (title, set_title) = create_signal(String::new());
    let (description, set_description) = create_signal(String::new());

    create_effect(move |_| {
        if let Some(token_value) = token.get() {
            let set_screenplays = set_screenplays.clone();
            let set_error = set_error.clone();
            spawn_local(async move {
                match fetch_screenplays(&token_value).await {
                    Ok(items) => set_screenplays.set(items),
                    Err(err) => set_error.set(Some(err)),
                }
            });
        }
    });

    let on_login = move |ev: SubmitEvent| {
        ev.prevent_default();
        let email_value = email.get();
        let password_value = password.get();
        let set_token = set_token.clone();
        let set_error = set_error.clone();
        spawn_local(async move {
            match login(LoginRequest {
                email: email_value,
                password: password_value,
            })
            .await
            {
                Ok(response) => {
                    set_token.set(Some(response.token.clone()));
                    set_error.set(None);
                }
                Err(err) => set_error.set(Some(err)),
            }
        });
    };

    let on_create = move |ev: SubmitEvent| {
        ev.prevent_default();
        if let Some(token_value) = token.get() {
            let title_value = title.get();
            let description_value = description.get();
            let set_screenplays = set_screenplays.clone();
            let set_error = set_error.clone();
            let set_title = set_title.clone();
            let set_description = set_description.clone();
            spawn_local(async move {
                match create_screenplay(
                    &token_value,
                    ScreenplayRequest {
                        title: title_value,
                        description: description_value,
                    },
                )
                .await
                {
                    Ok(items) => {
                        set_screenplays.set(items);
                        set_error.set(None);
                        set_title.set(String::new());
                        set_description.set(String::new());
                    }
                    Err(err) => set_error.set(Some(err)),
                }
            });
        }
    };

    view! {
        <main class="min-h-screen bg-slate-900 text-slate-100 font-sans">
            <section class="max-w-4xl mx-auto py-12 px-6">
                <h1 class="text-3xl font-bold mb-6 text-center">"The Copy"</h1>
                <p class="mb-8 text-center text-slate-300">
                    "Manage your screenplay drafts and stay in sync with the backend services."
                </p>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <form class="bg-slate-800 rounded-lg p-6 shadow" on:submit=on_login>
                        <h2 class="text-xl font-semibold mb-4">"Sign in"</h2>
                        <label class="block mb-4">
                            <span class="block text-sm text-slate-300">"Email"</span>
                            <input
                                class="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                prop:value=email
                                on:input=move |ev| set_email(event_target_value(&ev))
                                type="email"
                                required
                            />
                        </label>
                        <label class="block mb-6">
                            <span class="block text-sm text-slate-300">"Password"</span>
                            <input
                                class="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                prop:value=password
                                on:input=move |ev| set_password(event_target_value(&ev))
                                type="password"
                                required
                            />
                        </label>
                        <button
                            class="w-full rounded bg-emerald-600 py-2 font-semibold text-white transition hover:bg-emerald-500"
                            type="submit"
                        >"Login"</button>
                    </form>

                    <form class="bg-slate-800 rounded-lg p-6 shadow" on:submit=on_create>
                        <h2 class="text-xl font-semibold mb-4">"Create screenplay"</h2>
                        <label class="block mb-4">
                            <span class="block text-sm text-slate-300">"Title"</span>
                            <input
                                class="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                prop:value=title
                                on:input=move |ev| set_title(event_target_value(&ev))
                                type="text"
                            />
                        </label>
                        <label class="block mb-6">
                            <span class="block text-sm text-slate-300">"Description"</span>
                            <textarea
                                class="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                prop:value=description
                                on:input=move |ev| set_description(event_target_value(&ev))
                                rows=4
                            ></textarea>
                        </label>
                        <button
                            class="w-full rounded bg-sky-600 py-2 font-semibold text-white transition hover:bg-sky-500"
                            type="submit"
                        >"Create"</button>
                    </form>
                </div>

                {move || token.get().is_none().then(|| view! { <p class="mt-6 text-center text-amber-400">"Login to sync with the backend."</p> })}
                {move || error.get().map(|message| view! { <p class="mt-6 text-center text-rose-400">{message}</p> })}

                <div class="mt-10 space-y-4">
                    <For
                        each=move || screenplays.get()
                        key=|screenplay| screenplay.id.clone()
                        children=move |screenplay: Screenplay| {
                            view! {
                                <article class="rounded border border-slate-700 bg-slate-800 p-4 shadow-sm">
                                    <h3 class="text-lg font-semibold text-emerald-400">{screenplay.title.clone()}</h3>
                                    <p class="text-slate-300">{screenplay.description.clone()}</p>
                                </article>
                            }
                        }
                    />
                </div>
            </section>
        </main>
    }
}

async fn login(payload: LoginRequest) -> std::result::Result<AuthResponse, String> {
    let response = Request::post(&format!("{}/auth/login", backend_base_url()))
        .header("Content-Type", "application/json")
        .body(serde_json::to_string(&payload).map_err(|err| format!("serialization error: {err}"))?)
        .send()
        .await
        .map_err(|err| format!("network error: {err}"))?;

    if !response.ok() {
        return Err(format!("login failed with status {}", response.status()));
    }

    response
        .json()
        .await
        .map_err(|err| format!("failed to parse login response: {err}"))
}

async fn fetch_screenplays(token: &str) -> std::result::Result<Vec<Screenplay>, String> {
    let response = Request::get(&format!("{}/screenplays", backend_base_url()))
        .header("Authorization", &format!("Bearer {token}"))
        .send()
        .await
        .map_err(|err| format!("network error: {err}"))?;

    if !response.ok() {
        return Err(format!("failed to load screenplays: {}", response.status()));
    }

    response
        .json()
        .await
        .map_err(|err| format!("failed to parse screenplays: {err}"))
}

async fn create_screenplay(
    token: &str,
    payload: ScreenplayRequest,
) -> std::result::Result<Vec<Screenplay>, String> {
    let response = Request::post(&format!("{}/screenplays", backend_base_url()))
        .header("Authorization", &format!("Bearer {token}"))
        .header("Content-Type", "application/json")
        .body(serde_json::to_string(&payload).map_err(|err| format!("serialization error: {err}"))?)
        .send()
        .await
        .map_err(|err| format!("network error: {err}"))?;

    if !response.ok() {
        return Err(format!(
            "failed to create screenplay: {}",
            response.status()
        ));
    }

    fetch_screenplays(token).await
}

#[cfg(target_arch = "wasm32")]
mod tests {
    use super::*;
    use wasm_bindgen_test::*;

    wasm_bindgen_test_configure!(run_in_browser);

    #[wasm_bindgen_test]
    fn app_renders_login_form() {
        leptos::leptos_dom::HydrationCtx::stop_hydrating();
        leptos::mount_to_body(|| view! { <App/> });
        let document = leptos::window().document().expect("document");
        assert!(document.query_selector("form").unwrap().is_some());
    }
}
