import json
from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.template import loader

from apps.tech_stack.utils import core_repo_list
from utils.github_calendar.github_calendar import generate_github_calendar


def exception_view(request, exception=None):
    status = 404
    context = {'error': status, 'message': 'Page not found. Check the address or'}
    if exception is None:
        status = 500
        context = {'error': status, 'message': 'Server error'}
    return render(request, 'exception_page.html', context, status=status)


def main_page(request):
    return render(request, 'index.html')


def loading_page(request, github_id):
    user_data = {"github_id": github_id, "tech_stack": True}
    if request.POST.get('update'):
        user_data['update'] = True
        core_repo_list(user_data)
        return JsonResponse({'status': 'analyzing'})
    core_response = core_repo_list(user_data)
    if core_response['status'] == 'fail' and (core_response.get('msg') == 'token does not exist' or core_response.get('msg') == 'github API error'):
        error_code = 400
        return render(request, 'exception_page.html', {'error': error_code, 'message': 'Please check the user or try again later'})
    elif core_response.get('tech_card_data'):
        context = {
            'github_user_data': core_response.get('github_user_data'),
            'tech_card_data': core_response.get('tech_card_data'),
            'calendar_data': core_response.get('calendar_data'),
            'status': core_response.get('status')
        }
        return render(request, 'git_analysis.html', context)
    return render(request, 'loading.html', {'github_id': github_id})


def analyze_page(request):
    if request.method != 'POST':
        return JsonResponse({"status":"Not allowed method"})
    github_id = request.POST.get('github_id')
    if not github_id:
        return JsonResponse({"status": "no github id"})

    user_data = {"github_id": github_id, "tech_stack": True}
    core_response = core_repo_list(user_data)
    core_status = core_response['status']
    if core_status != 'success':
        return JsonResponse({"status": core_status})
    context = {
        'github_user_data': core_response.get('github_user_data'),
        'tech_card_data': core_response.get('tech_card_data'),
    }
    json_data = {
        'status': core_status,
        'calendar_data': json.loads(core_response.get('calendar_data'))
    }
    content = loader.render_to_string(
        'min_git_analysis.html',
        context,
        request
    )
    return JsonResponse({"content": content, **json_data})


def git_rainbow_svg(request, github_id):
    user_data = {"github_id": github_id, "tech_stack": True}
    core_response = core_repo_list(user_data)
    if core_response.get('tech_card_data'):
        tech_card_data = core_response.get('tech_card_data')
        calendar_data = json.loads(core_response.get('calendar_data'))
    else:
        return redirect(f'/{github_id}')

    status, svg_inner_html = generate_github_calendar(calendar_data)
    if status == False:
        return JsonResponse({"status":"fail"})

    index = 0
    for tech_data in tech_card_data:
        tech_data['index'] = index
        index += 1
    tech_card_width = 126.25
    return render(request, 'git_rainbow_svg.html', { 'github_id': github_id,
                                                      'tech_card_data': tech_card_data,
                                                      'tech_card_width': tech_card_width,
                                                      'github_calendar_svg': svg_inner_html[0]},
                  content_type='image/svg+xml')
