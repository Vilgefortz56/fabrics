
from django import template
from django.utils.http import urlencode

register = template.Library()

# @register.filter
# def urlencode(value):
#     return urlencode({'': value})[1:]

@register.filter(name='trim')
def trim(value):
    if isinstance(value, str):
        return value.strip()
    return value

@register.filter
def is_list(value):
    return isinstance(value, (list, tuple))